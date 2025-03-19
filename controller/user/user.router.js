const express = require("express");
const { verifyAuth } = require("../../utils/basic");
const { createPasswords, getPasswords } = require("./user.controller");

const userRouter = express.Router()
    // User routes go here...
    .use(verifyAuth)
    .get('/get', getPasswords)
    .post('/create', createPasswords)
    .post('/update')
    .post('/delete' )


module.exports = userRouter;