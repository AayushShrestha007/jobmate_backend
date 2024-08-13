
const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
    },
    organizationAddress: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    employerImage: {
        type: String,
    },
    jobsPosted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'jobs'
    }]
}, {
    timestamps: true
});

const Employer = mongoose.model('employers', employerSchema);
module.exports = Employer;



