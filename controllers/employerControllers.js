
const path = require('path');

const employerModel = require('../models/employerModel');

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

const fs = require('fs');

//code for registration
const register = async (req, res) => {

    //1. Check incoming data
    console.log(req.body);

    //2. Destructure the incoming data
    const { organizationName, organizationAddress, email, phone, password } = req.body;

    //3. Validate the data (if empty, stop the process & send res)
    if (!organizationName || !organizationAddress || !email || !password || !phone) {
        //res.send("please enter all the details")
        return res.status(400).json({
            "success": false,
            "message": "Please enter all fields!"
        })

    }

    // Validating the image
    if (!req.files || !req.files.employerImage) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image!',
        });
    }

    const { employerImage } = req.files;

    //  Upload the image
    // 1. Generate new image name
    const imageName = `${Date.now()}-${employerImage.name}`;

    // 2. Make a upload path (/path/upload - directory)
    const imageUploadPath = path.join(
        __dirname,
        `../public/employerImage/${imageName}`
    );

    //4. Error handling (try/catch)
    try {
        //5. Check if the employer with this email is already registered or not
        const existingEmployer = await employerModel.findOne({ email: email })
        //5.1 If employer found-> send response 
        //5.1.1 stop the process
        if (existingEmployer) {
            return res.json({
                "success": false,
                "message": "an employer with this email already exists"
            })
        }

        //5.2 if employer is new:
        //5.2.1 Hash the password
        const randomSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, randomSalt)

        await employerImage.mv(imageUploadPath);

        //5.2.2 Save to the database
        const newEmployer = new employerModel({
            //database fields: client's value
            organizationName: organizationName,
            organizationAddress: organizationAddress,
            email: email,
            phone: phone,
            password: hashedPassword,
            employerImage: imageName,
        })

        //save to database
        await newEmployer.save()

        //5.2.3 send successful response
        res.status(201).json({
            "success": true,
            "message": "Employer created successfully"
        }

        )

    } catch (error) {
        console.log(error)
        res.json({
            "success": false,
            "message": "Internal server error!"
        })
    }
}


//code for login
const login = async (req, res) => {

    //1. Check incoming data
    console.log(req.body);

    //2. Destructure the incoming data
    const { email, password } = req.body;

    //3. Validate the data (if empty, stop the process & send res)
    if (!email || !password) {
        return res.json({
            "success": false,
            "message": "Please enter all fields!"
        })

    }

    //4. Error handling (try/catch)

    //5.1 If email and password don't match-> send response 
    try {

        // find employer 

        const findemployer = await employerModel.findOne({ email: email });

        if (!findemployer) {
            return res.json({
                "success": false,
                "message": "employer with this email doesn't exist"
            })
        }

        //compare password
        const isValidPassword = await bcrypt.compare(password, findemployer.password)

        if (!isValidPassword) {
            return res.json({
                "success": false,
                "message": "Password doesn't match"
            })
        }

        //token (Generate- employer data + key)
        const token = await jwt.sign(

            {
                id: findemployer._id,
                role: "employer"
            },
            process.env.JWT_SECRET
        )

        //5.1 If login successful send response
        //5.1.1 stop the process
        return res.status(201).json({
            "success": true,
            "message": "employer login sucfessful",
            "token": token,
            "employerData": { findemployer }
        })

    } catch (error) {
        console.log(error)
        return res.json({
            "success": false,
            "message": "Internal server error!"
        })
    }
}

// code for updating employer
const updateEmployer = async (req, res) => {
    try {
        const employer = await employerModel.findById(req.params.id);

        if (!employer) {
            return res.status(404).json({
                success: false,
                message: 'Employer not found',
            });
        }

        if (req.files && req.files.employerImage) {
            const { employerImage } = req.files;
            const imageName = `${Date.now()}-${employerImage.name}`;
            const imageUploadPath = path.join(__dirname, `../public/employerImage/${imageName}`);

            if (employer.employerImage) {
                const oldImagePath = path.join(__dirname, `../public/employerImage/${employer.employerImage}`);
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.log('Failed to delete old image:', err);
                    } else {
                        console.log('Old image deleted');
                    }
                });
            }

            await employerImage.mv(imageUploadPath);
            req.body.employerImage = imageName;
        }

        if (req.body.password) {
            const randomSalt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, randomSalt);
        }

        const updatedEmployer = await employerModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            message: 'Employer updated successfully',
            employer: updatedEmployer
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

//Exporting the function 
module.exports = {
    register,
    login,
    updateEmployer
};
