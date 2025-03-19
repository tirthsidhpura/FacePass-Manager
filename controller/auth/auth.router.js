const express = require('express');
const { register, login, faceDetectFirst } = require('./auth.controller');

const authRouter = express.Router()
    .get('/login', (req, res) => { return res.status(200).json({message: "Hello World!"})})
    .post('/login', login)
    .post('/register', register)
    .post('/face/detect/first', faceDetectFirst)



module.exports = authRouter;