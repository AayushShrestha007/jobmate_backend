const mongoose = require('mongoose');
const dotenv = require('dotenv')

//configuring dotenv
dotenv.config();

const connectDatabase = () => {
    mongoose.connect(process.env.MOGODB_CLOUD).then(() => {
        console.log("database connected successfully")
    })
}

module.exports = connectDatabase;