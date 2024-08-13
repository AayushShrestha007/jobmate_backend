const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'jobs',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'job-offered', 'hired', 'rejected', 'complete'],
        default: 'applied'
    },
    appliedOn: {
        type: Date,
        default: Date.now
    },
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'resumes',
        required: false
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
