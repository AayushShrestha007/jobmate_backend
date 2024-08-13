const path = require('path');
const fs = require('fs');
const Resume = require('../models/resumeModel');
const User = require('../models/userModel');

const createResume = async (req, res) => {
    // Check if a file is uploaded
    if (!req.files || !req.files.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload a resume!',
        });
    }

    const { file } = req.files;
    const userId = req.user.id;; // Get the user ID from the request body

    // Generate a unique file name using timestamp and original file name
    const resumeName = `${Date.now()}-${file.name}`;

    // Define the upload path
    const uploadPath = path.join(__dirname, '../public/userResume', resumeName);

    // Error handling (try/catch)
    try {
        // Move the file from the temp location to the intended location
        await file.mv(uploadPath);

        // Prepare the resume data
        const resumeData = {
            applicant: userId,
            resumeTitle: req.body.resumeTitle,
            previousCompanyName: req.body.previousCompanyName,
            jobTitle: req.body.jobTitle,
            jobDuration: req.body.jobDuration,
            jobDescription: req.body.jobDescription,
            highestEducation: req.body.highestEducation,
            educationInstitute: req.body.educationInstitute,
            fileUrl: `/userResume/${resumeName}`
        };

        // Save the resume to the database
        const newResume = new Resume(resumeData);
        await newResume.save();

        // Add the resume to the user document
        await User.findByIdAndUpdate(userId, { $push: { resumes: newResume._id } });


        // Send successful response
        res.status(201).json({
            success: true,
            message: 'Resume uploaded and saved successfully!',
            resume: newResume,
            body: userId,
        });
    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

const getResumesByUser = async (req, res) => {
    const userId = req.user.id; 
    const { page = 1, limit = 5 } = req.query; // Default to page 1 and limit 5

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        // If user not found, return an error response
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!',
            });
        }

        // Get the total number of resumes
        const totalResumes = await Resume.countDocuments({ applicant: userId });

        // Find the resumes with pagination
        const resumes = await Resume.find({ applicant: userId })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Return the resumes with pagination info
        res.status(200).json({
            success: true,
            resumes,
            totalResumes,
            currentPage: page,
            totalPages: Math.ceil(totalResumes / limit),
        });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

module.exports = {
    getResumesByUser,
};


module.exports = {
    createResume,
    getResumesByUser
};
