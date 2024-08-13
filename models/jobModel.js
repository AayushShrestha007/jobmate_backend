const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employers',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    workType: {
        type: String,
        required: true,
        enum: ['Remote', 'On-site', 'Hybrid'],
    },
    description: {
        type: String,
        required: true,
    },
    skills: {
        type: String,
        required: true,
    },
    qualification: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'Closed'],
        default: 'Open'
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'applications'
    }]
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Job = mongoose.model('jobs', jobSchema);
module.exports = Job;





