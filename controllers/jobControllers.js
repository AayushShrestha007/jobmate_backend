
const jobModel = require('../models/jobModel');
const employerModel = require('../models/employerModel');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const userModel = require('../models/userModel');

const createJob = async (req, res) => {

    const employerId = req.user.id;

    // Extracting job details from the request body
    const { title, workType, description, skills, qualification } = req.body;

    // Validate the input data
    if (!title || !workType || !description || !skills || !qualification) {
        return res.status(400).json({
            success: false,
            message: "Please enter all required fields!"
        });
    }

    try {
        // Create a new job entry
        const newJob = new jobModel({
            title,
            workType,
            description,
            skills,
            qualification,
            employer: employerId,  // Associate this job with the logged-in employer
            status: 'Open'         // Default status
        });

        // Save the job to the database
        await newJob.save();

        // Update the employer's jobsPosted field
        await employerModel.findByIdAndUpdate(
            employerId,
            { $push: { jobsPosted: newJob._id } },
            { new: true }
        );

        // Send a success response
        res.status(201).json({
            success: true,
            message: "Job created successfully",
            job: newJob
        });
    } catch (error) {
        console.error('Create Job Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

//function to fetch all open jobs by employer
const getAllOpenJobsByEmployer = async (req, res) => {
    // Extract page number and limit from query parameters
    const pageNo = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    try {
        // Get the employer ID from the logged-in user's request
        const employerId = req.user.id;

        // Calculate the number of jobs to skip based on current page
        const skip = (pageNo - 1) * limit;

        // Find all jobs that are open and created by the logged-in employer with pagination
        const openJobs = await jobModel.find({
            employer: employerId,
            status: 'Open'
        })
            .skip(skip)
            .limit(limit);

        // Count total number of jobs for the employer
        const totalJobs = await jobModel.countDocuments({
            employer: employerId,
            status: 'Open'
        });

        // Check if there are no jobs found
        if (openJobs.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No jobs found"
            });
        }

        res.status(201).json({
            success: true,
            message: "Open jobs fetched successfully",
            jobs: openJobs,
            currentPage: pageNo,
            totalJobs: totalJobs,
            totalPages: Math.ceil(totalJobs / limit)
        });
    } catch (error) {
        console.error("Error fetching open jobs: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}



//function to  fetch get all the open job
const getAllOpenJobs = async (req, res) => {
    const pageNo = parseInt(req.query.page) || 1;
    const resultPerPage = parseInt(req.query.limit) || 3;
    const userId = req.user.id;

    try {
        // Get the list of jobs the user has already applied to
        const user = await userModel.findById(userId).populate('applications.job');
        const appliedJobIds = user.applications.map(app => app.job._id);

        // Count the total number of open jobs excluding the applied jobs
        const totalJobs = await jobModel.countDocuments({
            status: 'Open',
            _id: { $nin: appliedJobIds }
        });

        // Find open jobsn, excluding the applied jobs
        const jobs = await jobModel.find({
            status: 'Open',
            _id: { $nin: appliedJobIds }
        })
            .populate('employer', 'organizationName employerImage')
            .skip((pageNo - 1) * resultPerPage)
            .limit(resultPerPage);

        // If no jobs found on the requested page
        if (jobs.length === 0) {
            return res.status(200).json({
                success: false,
                jobs: [],
                message: "No jobs found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Jobs fetched successfully",
            jobs: jobs,
            totalJobs: totalJobs,
            currentPage: pageNo,
            totalPages: Math.ceil(totalJobs / resultPerPage)
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


//function to get individual job by id
const getJobById = async (req, res) => {
    try {
        const job = await jobModel.findById(req.params.id).populate('employer');
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }
        res.status(201).json({
            success: true,
            job,
        });
    } catch (error) {
        console.error('Get Job By ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

//pagination of Jobs
const paginationAllOpenJobs = async (req, res) => {

    const pageNo = req.query.page || 1;
    const resultPerPage = req.query.limit || 4;

    try {
        //find all jobs, skip , limit
        const jobs = await jobModel.find({}).skip((pageNo - 1) * resultPerPage).limit(resultPerPage)

        //if a page with no job is requested
        if (jobs.length === 0) {
            return res.json({
                'success': false,
                'message': "No jobs found"
            })
        }
        res.status(201).json({
            'success': true,
            'message': "job fetched",
            'jobs': jobs
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            'success': false,
            'message': "Internal server error"
        })

    }

}

const getApplicantsForJob = async (req, res) => {
    const { jobId } = req.params;

    try {
        // Find the job to check if it exists
        const job = await jobModel.findById(jobId).populate('employer');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Aggregation pipeline to find applicants with applications for the job with status "applied"
        const applicants = await userModel.aggregate([
            {
                $match: {
                    'applications.job': new ObjectId(jobId),
                    'applications.status': 'applied'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    userImage: 1,
                    resumes: 1,
                    applications: {
                        $filter: {
                            input: '$applications',
                            as: 'application',
                            cond: {
                                $and: [
                                    { $eq: ['$$application.job', new ObjectId(jobId)] },
                                    { $eq: ['$$application.status', 'applied'] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'resumes',
                    localField: 'resumes',
                    foreignField: '_id',
                    as: 'resumes'
                }
            },
            {
                $match: {
                    'applications.0': { $exists: true }
                }
            }
        ]);

        console.log('Filtered applicants:', applicants); // Debug statement

        res.status(200).json({
            success: true,
            message: 'Applicants fetched successfully',
            applicants
        });
    } catch (error) {
        console.error('Get Applicants Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};





module.exports = {
    createJob,
    getAllOpenJobs,
    paginationAllOpenJobs,
    getAllOpenJobsByEmployer,
    getJobById,
    getApplicantsForJob
};