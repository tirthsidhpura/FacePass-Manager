const connection = require("../../connection");
const { exec } = require('child_process');
const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const util = require("util");
const { generateRandomId } = require("../../utils/basic");
var fs = require('fs');
const path = require('path');

const SECRET_KEY = "your_secret_key"; // Replace with a secure key
const query = util.promisify(connection.query).bind(connection);

exports.register = async (req, res) => {
    const schema = joi.object({
        name: joi.string().min(3).required(),
        email: joi.string().email().required(),
        password: joi.string().min(8).required()
    });

    try {
        const { error, value } = schema.validate(req.body);
        if (error) throw error;

        const { name, email, password } = value;

        // Check if user already exists
        const results = await query("SELECT * FROM users WHERE email = ?", [email]);
        if (results.length > 0) return res.status(400).json({ status: false, message: "Email already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const genid = generateRandomId();

        console.log('creating director')
        const dir = path.join(__dirname, '../../uploads', genid);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Directory created: ${dir}`);
        } else {
            console.log(`Directory already exists: ${dir}`);
        }

        // Insert user into database
        const ch = await query("INSERT INTO users (name, email, password, genId) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, genid]);
        console.log({ch})
        const token = jwt.sign({ id: ch.insertId, email: value.email, id: genid }, SECRET_KEY, { expiresIn: "1h" });
        res.status(201).json({ status: true, message: "User registered successfully" , token});
    } catch (error) {
        return res.status(400).json({ status: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    const schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).required()
    });

    try {
        const { error, value } = schema.validate(req.body);
        if (error) throw error;

        const { email, password } = value;

        // Check if user exists
        const results = await query("SELECT * FROM users WHERE email = ?", [email]);
        if (results.length === 0) return res.status(400).json({ status: false, message: "Invalid email or password" });

        const user = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ status: false, message: "Invalid email or password" });

        const token = jwt.sign({ id: user.id, email: user.email, id: results[0].genId }, SECRET_KEY, { expiresIn: "1h" });

        res.status(200).json({ status: true, message: "Login successful", token, faceStatus: results[0].isFacedetection});
    } catch (error) {
        return res.status(400).json({ status: false, message: error.message });
    }
};


exports.faceDetectFirst = async (req, res) => {
    try {
        const { token } = req.body;

        // Verify the JWT token
        const decoded = jwt.verify(token, SECRET_KEY);
        const { id } = decoded;
        console.log({ id });

        // Define paths
        const pythonScriptPath = path.join(__dirname, '../../child_processes/process_faces.py');
        const pythonScriptPath1 = path.join(__dirname, '../../child_processes/train_recognizer.py');
        const inDirectory = path.join(__dirname, `../../uploads/${id}/firsttime`);
        const outDirectory = path.join(__dirname, `../../uploads/${id}/${id}_1`); // Fixed typo: 'proccesses' -> 'processed'
        const outDirectory1 = path.join(__dirname, `../../uploads/${id}`); // Fixed typo: 'proccesses' -> 'processed'
        const trainDirectory = path.join(__dirname, `../../uploads/${id}/train`);

        // Create the output directory if it doesn't exist
        if (!fs.existsSync(outDirectory)) {
            fs.mkdirSync(outDirectory, { recursive: true });
        }

        // Execute the first Python script
        const command = `py ${pythonScriptPath} ${id} ${inDirectory} ${outDirectory}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing script: ${error.message}`);
                return res.status(500).json({ status: false, message: 'Error processing images' });
            }
            if (stderr) {
                console.error(`Script error: ${stderr}`);
                return res.status(500).json({ status: false, message: 'Script error' });
            }

            console.log(`Script output: ${stdout}`);

            // Check if the first script completed successfully
            if (stdout.includes('Finished processing images')) {
                console.log(`Completed for user ${id}`);
                console.log(`Start training data`);
                fs.rmSync(inDirectory, { recursive: true })
                // Execute the second Python script
                console.log(`${inDirectory} is deleted!`);
                const command1 = `py ${pythonScriptPath1} ${outDirectory1} ${trainDirectory}`;
                exec(command1, async (error, stdout, stderr) => {
                    
                    console.log(`Started command 2`);

                    if (error) {
                        console.error(`Error executing script: ${error.message}`);
                        fs.rm(outDirectory, { recursive: true, force: true }, (err) => {
                            if (err) {
                              console.error('Error deleting folder:', err);
                            } else {
                              console.log('Folder deleted successfully');
                            }
                          });
                        return res.status(500).json({ status: false, message: 'Error training model' });
                    }
                    if (stderr) {
                        console.error(`Script error: ${stderr}`);
                        return res.status(500).json({ status: false, message: 'Script error' });
                    }

                    console.log(`Script output: ${stdout}`);

                    // Check if the second script completed successfully
                    if (stdout.includes("Training completed and model saved as")) {
                        // Update the database
                        fs.rm(outDirectory, { recursive: true, force: true }, (err) => {
                            if (err) {
                              console.error('Error deleting folder:', err);
                            } else {
                              console.log('Folder deleted successfully');
                            }
                          });
                        await query(`UPDATE users SET isFacedetection = ? WHERE genId = ?`, [true, id]);
                        return res.status(200).json({ status: true, message: 'Data trained successfully' , faceStatus: true});
                    }
                });
            }
        });
    } catch (error) {
        console.error({ error });
        return res.status(400).json({ status: false, message: error.message });
    }
};