const express = require('express');
const connectDatabase = require('./database/database')
const dotenv = require('dotenv')
const cors = require('cors');
const fileUpload = require('express-fileupload');
const acceptFormData = require('express-fileupload')

const { MongoClient } = require('mongodb');



//create an express application
const app = express();

//configure cors policy
const corsOptions = {
    origin: true,
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))

//express json config
app.use(express.json())

//make a static public folder
app.use(express.static("./public"))


// for handling file uploads
app.use(fileUpload());


//connect to database
connectDatabase();

//configuring routes 
app.use('/api/user', require('./routes/userRoutes'))
app.use('/api/job', require('./routes/jobRoutes'))
app.use('/api/employer', require('./routes/employerRoutes'))
app.use('/api/resume', require('./routes/resumeRoutes'))
app.use('/api/resume', require('./routes/resumeRoutes'))
app.use('/api/applications', require('./routes/applicationRoutes'))


//config form data
app.use(acceptFormData());

//dotenv configuration
dotenv.config()



//using the port defined in env
const PORT = process.env.PORT;

//Making a test endpoint
app.get('/test', (req, res) => {
    res.send("Test api is working for Job Mate");
})



//Starting the server
app.listen(PORT, () => {
    console.log(`server is now running on port ${PORT}!`);
})

module.exports = app;