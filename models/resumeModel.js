const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    resumeTitle: {
        type: String,
        required: true
    },
    previousCompanyName: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String,
        required: true
    },
    jobDuration: {
        type: String,
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    highestEducation: {
        type: String,
        required: true
    },
    educationInstitute: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true 
    }
}, {
    timestamps: true // Helps in tracking when the resume was created or last updated
});

const Resume = mongoose.model('resumes', resumeSchema);
module.exports = Resume;
