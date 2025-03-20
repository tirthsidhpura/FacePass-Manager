const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const authRouter = require('./controller/auth/auth.router');
const { exec, spawn } = require('child_process');
const userRouter = require('./controller/user/user.router');
const { generateRandomId } = require('./utils/basic');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const SECRET_KEY = "your_secret_key"; // Replace with a secure key
const clients = new Map();



function authenticateUser(userId, imagePath, trainerPath, callback) {

    const pythonScriptPath = path.join(__dirname, './child_processes/authenticate_user.py');

    // Construct the command
    const command = `py ${pythonScriptPath} ${userId} "${imagePath}" "${trainerPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing authentication script: ${error}`);
            return callback(error);
        }
        if (stderr) {
            console.error(`Authentication stderr: ${stderr}`);
        }
        console.log(`Authentication stdout: ${stdout}`);

        // Check stdout for a success message
        if (stdout.includes("AUTH_SUCCESS")) {
            // Authentication was successful
            callback(null, "Authentication successful");
        } else {
            // Authentication failed or no valid output
            // callback(new Error("Authentication failed"));
        }
    });
}



function detectFace(userId, imagePath) {
    return new Promise((resolve, reject) => {

        const pythonScriptPath = path.join(__dirname, './child_processes/detect_face.py');

        // Construct the command
        console.log({imagePath})
        const command = `py ${pythonScriptPath} "${imagePath}" "${userId}"`;

        const pythonProcess = exec(command);

        let output = "";
        let errorOutput = "";

        // Collect stdout data
        pythonProcess.stdout.on("data", (data) => {
            // console.log("data rea", data)
            output += data.toString();
        });

        // Collect stderr data
        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        // Handle process exit
        pythonProcess.on("close", (code) => {
            if (errorOutput) {
                try {
                    resolve({status: false, output});
                } catch (err) {
                    
                    resolve({status: false, error: "Unknown error", details: errorOutput });
                }
            } else {
                try {
                    if(output.includes("No")) {
                        resolve({status: false, error: "Unknown error 1"});
                    }
                    else {
                        resolve({status: true, output});
                    }
                } catch (err) {
                    reject({status: false, error: "Invalid JSON output", details: output });
                }
            }
        });
    });
}

wss.on('connection', (ws) => {
    console.log('Client connected');


    // Function to send a message to a specific client
    function sendToClient(clientId, message) {
        const client = clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(message);
            console.log(`Message sent to client ${clientId}: ${message}`);
        } else {
            console.log(`Client ${clientId} not found or not connected.`);
        }
    }

    ws.on('message', async (message) => {
        const clientId = generateRandomId();
        try {
            const data = JSON.parse(message);
            if (data.type === 'image' && data.image) {
                // console.log({data})
                let jwtGet;
                try {
                    jwtGet = jwt.verify(data.data, SECRET_KEY)
                } catch (error) {
                    sendToClient(clientId, JSON.stringify({status: false, message: 'Authentication failed'}));
                    setTimeout(() => {
                        ws.close();
                    }, 15000);
                }
                // console.log({jwtGet})
                // console.log(`Client connected: ${clientId}`);
            
                // Store the client's WebSocket connection in the map
                clients.set(clientId, ws);
                const buffer = Buffer.from(data.image, 'base64');

                // Save the image
                if(data.first == true) {                    

                    const uploadsDir = path.join(__dirname, `uploads/${jwtGet.id}/firsttime`);

                    // Create directory if it doesn't exist
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }
                
                    // Read the directory and count the number of files
                    const files = fs.readdirSync(uploadsDir);
                    const maxImages = 30;
                
                    if (files.length >= maxImages) {
                        // Send a message to the client if the limit is reached
                        // console.log('Maximum of 20 images already stored.');
                        // uncoment this it is development only
                        sendToClient(clientId, JSON.stringify({status: true, message: 'Maximum of 20 images already stored'}))
                    } else {
                        // Save the new image if the limit is not reached
                        const filepath1 = `image_${Date.now()}.jpg`
                        const filePath = path.join(uploadsDir, filepath1);

                        fs.writeFileSync(filePath, buffer);
                        console.log(`come here`)
                        const checkData = await detectFace(clientId, filePath)
                        console.log({checkData});

                        if(checkData.status == true) {
                            // Authentication was successful
                            sendToClient(clientId, JSON.stringify({status: true, message: 'imageCaptured', success: true}));
                     
                        }
                        else if(checkData.status == false) {
                            console.log(`fail`)
                            sendToClient(clientId, JSON.stringify({status: false, message: 'imagenotCaptured', success: false}));
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                  console.error('Error deleting the image:', err);
                                } else {
                                  console.log('Image deleted successfully!');
                                }
                              });
                        }

                        // console.log('Image saved:', filePath);0

                        

                        // You can send a success response to the client here
                        // res.status(200).send('Image saved successfully.');
                    }
                    // ws.send(JSON.stringify({ type: 'your-id', id: clientId }));
                }
                else if(data.first == false) {

                    const uploadsDir = path.join(__dirname, `uploads/${jwtGet.id}/authenticate`);
                    const trainerDir = path.join(__dirname, `uploads/${jwtGet.id}/train/trainer.yml`);

                    // Create directory if it doesn't exist
                    if (!fs.existsSync(uploadsDir)) {
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    }
                
                    // Read the directory and count the number of files
                    const files = fs.readdirSync(uploadsDir);
                    const maxImages = 10;
                
                    if (files.length >= maxImages) {
                        sendToClient(clientId, JSON.stringify({status: false, message: 'Authentication failed'}));
                    } else {
                        const filePath = path.join(uploadsDir, `image_${Date.now()}.jpg`);
                        fs.writeFileSync(filePath, buffer);
                        // console.log('Image saved:', filePath);
                        const userId = jwtGet.id;
                        const imagePath = filePath;
                        
                        authenticateUser(userId, imagePath, trainerDir, (err, result) => {
                            if (err) {
                                // console.error("Operation failed:", err.message);
                                sendToClient(clientId, JSON.stringify({status: true, message: 'Authentication failed', success: false}));
                                setTimeout(() => {
                                    fs.rmSync(imagePath, { recursive: true })
                                }, 15000);
                            } else {
                                // console.log("Operation successful:", result);
                                fs.rmSync(imagePath, { recursive: true })
                                sendToClient(clientId, JSON.stringify({status: true, message: 'Authentication Successfull !', success: true}));
                            }
                        });
                    }
                }
            }
        } catch (error) {
            sendToClient(clientId, JSON.stringify({status: false, message: 'Authentication failed'}));
            console.error('Error processing image:', error);
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});

const port = 4000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/api/auth', authRouter);
app.use('/api/password', userRouter);

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Error handling for the server
server.on('error', (error) => {
    console.error('Server error:', error);
});