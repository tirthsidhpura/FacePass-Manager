const jwt = require("jsonwebtoken")

const SECRET_KEY = "your_secret_key"; // Replace with a secure key 
exports.generateRandomId= (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomId = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomId += characters[randomIndex];
    }

    return randomId;
}


exports.getId = async (req) => {
    const token = req.headers.authorization?.split(" ")[1];
    jwtGet = await jwt.verify(token, SECRET_KEY);
    return jwtGet.id; 
} 



exports.verifyAuth = async (req, res, next) => {
    try {

        console.log(req.headers)
        const token = req.headers.authorization?.split(" ")[1]; // Get token from headers
        console.log({token})
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.log({error})
        return res.status(403).json({ status: false, message: "Invalid or expired token" });
    }
};

const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = 'f9479cd91f8f22bd6764a08ad957b25baf8f8c284abb0616fc21e5e7328aa38b';
// const iv = 'd079d559d1fecac9d717b2578388978f';

// console.log("Secret Key (hex):", secretKey.toString('hex'));
// console.log("IV (hex):", iv.toString('hex'));
// console.log("IV length:", iv.length); // Should output 16


exports.encryptPassword = (password)=> {
    // const iv = Buffer.from(process.env.IV, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(password, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return {encrypted, iv};
  }
  
exports.decryptPassword = (encryptedPassword) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }