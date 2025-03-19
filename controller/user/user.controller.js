const Joi = require("joi");
const connection = require("../../connection");

const util = require("util");
const { getId, encryptPassword } = require("../../utils/basic");

const query = util.promisify(connection.query).bind(connection);

exports.getPasswords = async (req, res) => {
    try {
        const getUser = await getId(req);
        // console.log(first)
        const [userData] = await query(`SELECT sno from users WHERE genId = ?`, [getUser])

        const passwordData = await query(`SELECT * from passworddb WHERE userid = ?`, [userData.sno]);
        return res.status(200).json({status: true, passwordData});
    } catch (error) {
        return res.status(400).json({status: false, message: error.message});
    }
}


exports.createPasswords = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().trim().required(),
        password: Joi.string().trim().required()
    })
    try {

      const {error , value} = schema.validate(req.body);

      if(error) {
        throw new error
      }

      console.log({value});
      const getUser = await getId(req)
      console.log({getUser});

      const [userData] = await query(`SELECT sno from users WHERE genId = ?`, [getUser])

      value.userid = userData.sno
      const pass = value.password
    //   const v = encryptPassword(pass);
    //   value.password = v.encrypted
    //   value.iv = v.iv
      await query(`INSERT INTO passworddb SET ?`, [value])

      return res.status(200).json({status: true, message: 'Password Addded successfully'});
      
    } catch (error) {
        console.log({error})
        return res.status(400).json({status: false, message: error.message});
    }
}