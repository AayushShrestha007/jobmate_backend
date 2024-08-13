const applicationModel = require('../models/applicationModel');
const userModel = require('../models/userModel');
const jobModel = require('../models/jobModel');

const createApplication = async (req, res) => {
    const { jobId, resumeId } = req.body;
    const applicantId = req.user.id;

    if (!jobId || !resumeId) {
        return res.status(400).json({
            success: false,
            message: 'Job ID and Resume ID are required',
        });
    }

    try {
        const newApplication = new applicationModel({
            job: jobId,
            applicant: applicantId,
            resume: resumeId
        });

        await newApplication.save();

        // Update the job to include this new application
        await jobModel.findByIdAndUpdate(jobId, {
            $push: { applications: newApplication._id }
        });

        // Update the user's applications field
        await userModel.findByIdAndUpdate(
            applicantId,
            { $push: { applications: { resume: resumeId, job: jobId, status: 'applied', _id: newApplication._id } } },
            { new: true }
        );

        res.status(201).json({
            success: true,
            message: 'Application created successfully',
            application: newApplication,
        });
    } catch (error) {
        console.error('Create Application Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

const getUserApplications = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 5 } = req.query; // Default to page 1 and limit 5

    try {
        // Get the total number of applications
        const totalApplications = await applicationModel.countDocuments({ applicant: userId });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            applicant: userId,
            status: { $nin: ['job-offered', 'hired', 'complete'], }
        })
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Return the applications with pagination info
        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};



const getApplicationsByEmployer = async (req, res) => {
    const employerId = req.user.id;
    const { page = 1, limit = 5 } = req.query; // Default to page 1 and limit 5

    try {
        // Find jobs posted by the currently logged-in employer with status 'Open'
        const jobs = await jobModel.find({ employer: employerId, status: 'Open' });

        // Get the job IDs
        const jobIds = jobs.map(job => job._id);

        // Get the total number of applications for these jobs excluding those with status 'applied'
        const totalApplications = await applicationModel.countDocuments({
            job: { $in: jobIds },
            status: { $nin: ['applied'] }
        });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            job: { $in: jobIds },
            status: { $ne: 'applied' }
        })
            .populate('applicant')
            .populate('resume')
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Return the applications with pagination info
        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching applications by employer:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

const getHiredApplicationsByEmployer = async (req, res) => {
    const employerId = req.user.id;
    const { page = 1, limit = 5 } = req.query; // Default to page 1 and limit 5

    try {
        // Find jobs posted by the currently logged-in employer
        const jobs = await jobModel.find({ employer: employerId });

        // Get the job IDs
        const jobIds = jobs.map(job => job._id);

        // Get the total number of applications for these jobs with status 'hired'
        const totalApplications = await applicationModel.countDocuments({
            job: { $in: jobIds },
            status: 'hired'
        });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            job: { $in: jobIds },
            status: 'hired'
        })
            .populate('applicant')
            .populate('resume')
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Return the applications with pagination info
        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching hired applications by employer:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

const getCompleteApplicationsByEmployer = async (req, res) => {
    const employerId = req.user.id;
    const { page = 1, limit = 5 } = req.query; // Default to page 1 and limit 5

    try {
        // Find jobs posted by the currently logged-in employer
        const jobs = await jobModel.find({ employer: employerId });

        // Get the job IDs
        const jobIds = jobs.map(job => job._id);

        // Get the total number of applications for these jobs with status 'hired'
        const totalApplications = await applicationModel.countDocuments({
            job: { $in: jobIds },
            status: 'complete'
        });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            job: { $in: jobIds },
            status: 'complete'
        })
            .populate('applicant')
            .populate('resume')
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();

        // Return the applications with pagination info
        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching complete applications by employer:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};




const getUserOfferedApplications = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 5 } = req.query;

    try {
        // Get the total number of applications with status 'job-offered'
        const totalApplications = await applicationModel.countDocuments({ applicant: userId, status: 'job-offered' });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            applicant: userId,
            status: 'job-offered'
        })
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();


        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

const getUserHiredApplication = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 5 } = req.query;

    try {
        // Get the total number of applications with status 'job-offered'
        const totalApplications = await applicationModel.countDocuments({ applicant: userId, status: 'hired' });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            applicant: userId,
            status: 'hired'
        })
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();


        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

const getUserCompleteApplication = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 5 } = req.query;

    try {
        // Get the total number of applications with status 'complete'
        const totalApplications = await applicationModel.countDocuments({ applicant: userId, status: 'complete' });

        // Find the applications with pagination
        const applications = await applicationModel.find({
            applicant: userId,
            status: 'complete'
        })
            .populate({
                path: 'job',
                populate: {
                    path: 'employer',
                    model: 'employers'
                }
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .exec();


        res.status(200).json({
            success: true,
            applications,
            totalApplications,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalApplications / limit),
        });
    } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};


const updateApplicationStatus = async (req, res) => {
    const { applicationId, status } = req.body;
    const validStatuses = ['shortlisted', 'rejected', 'job-offered', 'hired', 'complete'];

    // Validate the status
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value',
        });
    }

    try {
        // Find the application and update the status
        const updatedApplication = await applicationModel.findByIdAndUpdate(
            applicationId,
            { status },
            { new: true }
        ).populate('applicant').populate('resume').populate({
            path: 'job',
            populate: {
                path: 'employer',
                model: 'employers'
            }
        });

        if (!updatedApplication) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Update the status in the user's applications array
        await userModel.updateOne(
            { _id: updatedApplication.applicant._id, 'applications.job': updatedApplication.job._id },
            { $set: { 'applications.$.status': status } }
        );

        if (status === 'hired') {
            await jobModel.findByIdAndUpdate(
                updatedApplication.job._id,
                { status: 'Closed' }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',

        });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error!',
        });
    }
};

module.exports = { createApplication, getUserApplications, getApplicationsByEmployer, updateApplicationStatus, getUserOfferedApplications, getUserHiredApplication, getUserCompleteApplication, getHiredApplicationsByEmployer, getCompleteApplicationsByEmployer };
