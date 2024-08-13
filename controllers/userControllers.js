
const path = require('path');

const userModel = require('../models/userModel');

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

const fs = require('fs');

//code for registration
const register = async (req, res) => {

    //1. Check incoming data
    console.log(req.body);

    //2. Destructure the incoming data
    const { name, email, phone, password } = req.body;

    //3. Validate the data (if empty, stop the process & send res)
    if (!name || !email || !password) {
        //res.send("please enter all the details")
        return res.json({
            "success": false,
            "message": "Please enter all fields!"
        })

    }

    // Validating the image
    if (!req.files || !req.files.userImage) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image!',
        });
    }

    const { userImage } = req.files;

    //  Upload the image
    // 1. Generate new image name
    const imageName = `${Date.now()}-${userImage.name}`;

    // 2. Make a upload path (/path/upload - directory)
    const imageUploadPath = path.join(
        __dirname,
        `../public/userImage/${imageName}`
    );

    //4. Error handling (try/catch)
    try {
        //5. Check if the user is already registered
        const existingUser = await userModel.findOne({ email: email })
        //5.1 If user found-> send response 
        //5.1.1 stop the process
        if (existingUser) {
            return res.json({
                "success": false,
                "message": "user already exists"
            })
        }

        //5.2 if user is new:
        //5.2.1 Hash the password
        const randomSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, randomSalt)

        await userImage.mv(imageUploadPath);

        //5.2.2 Save to the database
        const newUser = new userModel({
            //database fields: client's value

            name: name,
            email: email,
            phone: phone,
            password: hashedPassword,
            userImage: imageName,
        })

        //save to database
        await newUser.save()

        //5.2.3 send successful response
        res.status(201).json({
            "success": true,
            "message": "User created successfully"
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

//code to upload a file
const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "Please upload a file" });
        }
        res.status(201).json({
            success: true,
            data: req.file.filename,
        });
    } catch (error) {
        // Handle unexpected errors
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};



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

    //5.1 If username and password don't match-> send response 
    try {

        // find user 

        const findUser = await userModel.findOne({ email: email });

        if (!findUser) {
            return res.json({
                "success": false,
                "message": "user with this email doesn't exist"
            })
        }

        //compare password
        const isValidPassword = await bcrypt.compare(password, findUser.password)

        if (!isValidPassword) {
            return res.json({
                "success": false,
                "message": "Password doesn't match"
            })
        }

        //token (Generate- User data + key)
        const token = await jwt.sign(
            {
                id: findUser._id,
                role: "applicant"
            },
            process.env.JWT_SECRET
        )

        //5.1 If login successful send response
        //5.1.1 stop the process
        return res.status(201).json({
            "success": true,
            "message": "user login sucfessful",
            "token": token,
            "userData": { findUser }
        })

    } catch (error) {
        console.log(error)
        return res.json({
            "success": false,
            "message": "Internal server error!"
        })
    }
}


//code to update applicant
const updateApplicant = async (req, res) => {
    try {
        // Find the user to get the current image name
        const user = await userModel.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if a new image is uploaded
        if (req.files && req.files.userImage) {
            const { userImage } = req.files;

            // Generate new image name
            const imageName = `${Date.now()}-${userImage.name}`;

            // Make an upload path
            const imageUploadPath = path.join(
                __dirname,
                `../public/userImage/${imageName}`
            );

            // Delete the old image if it exists
            if (user.userImage) {
                const oldImagePath = path.join(
                    __dirname,
                    `../public/userImage/${user.userImage}`
                );
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.log('Failed to delete old image:', err);
                    } else {
                        console.log('Old image deleted');
                    }
                });
            }

            // Move the new file to the upload path
            await userImage.mv(imageUploadPath);

            // Add the new image name to the request body
            req.body.userImage = imageName;
        }

        // Check if password needs to be updated and hash it
        if (req.body.password) {
            const randomSalt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, randomSalt);
            req.body.password = hashedPassword;
        }

        // Update the user
        const updatedApplicant = await userModel.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: 'User Updated',
            user: updatedApplicant,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
};


//get current user
const getCurrentApplicant = async (req, res) => {
    try {
        // Show current user
        const applicant = await applicant.findById(req.user.id).select("-password");

        res.status(201).json({
            success: true,
            message: "Current applicant retrieved",
            data: applicant
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//Exporting the function 
module.exports = {
    register,
    login,
    updateApplicant,
    getCurrentApplicant,
    uploadImage,
};
