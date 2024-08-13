const request = require('supertest');
const app = require('../index');
const path = require('path');

//test token and id for employer
const employerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2OGYwOTVlODAwOTkxZmNlYzhjYmViMSIsInJvbGUiOiJlbXBsb3llciIsImlhdCI6MTcyMzM4NjM4NH0.o4YPEAjiOfj8hInuj4tFPpzHQWZaAnFlV6IjI_uLoMM"
const employerId = "668f095e800991fcec8cbeb1"
//test token and id for applicant
const applicantToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2OWFkNWNiYjE5ZWIxNjZmN2MzNzdiNSIsInJvbGUiOiJhcHBsaWNhbnQiLCJpYXQiOjE3MjMzNzgzMDd9.lyBIAmXateLzENrvXnymJGJXrco_-6u4FTGhHSgHcmI"
const applicantId = "669ad5cbb19eb166f7c377b5"
//test id for job
const jobId = "669953dfcce330310d08cd0c"

//defining multiple test cases
describe('Api Testing', () => {

    //testing '/test' api
    it('GET /test | Response with text', async () => {
        const response = await request(app).get('/test')

        //if its successful
        expect(response.statusCode).toBe(200)

        //compare to received test
        expect(response.text).toEqual("Test api is working for Job Mate")
    })

    //-----------USER TEST-----------//
    //registration test
    it('POST /api/user/register | register applicant', async () => {
        const response = await request(app).post('/api/user/register')
            .field('name', 'aakriti')
            .field('phone', '9840574904')
            .field('email', 'aakriti@gmail.com')
            .field('password', '12345')
            .attach('userImage', path.resolve(__dirname, 'test.png'));

        if (!response.body.success) {
            expect(response.body.message).toEqual("user already exists")
        }
        else {
            expect(response.body.message).toEqual("User created successfully")
        }

        expect(response.body).toBeDefined();
    })

    //login test
    it('POST /api/user/login |  login applicant', async () => {
        const response = await request(app).post('/api/user/login').send({
            "email": "ayush@gmail.com",
            "password": "12345"
        })

        if (response.body.success) {
            expect(response.body.message).toEqual("user login sucfessful")
            expect(response.body.userData).toBeDefined();
            expect(response.body.userData.findUser.name).toEqual("Ayush")
            expect(response.body.token).toBeDefined();
            expect(response.body.token.length).toBeGreaterThan(0);

        } else {
            // If login was not successful, assert the failure scenario
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("user with this email doesn't exist"); // Adjust the message based on your actual implementation
        }

        // Ensure response is defined
        expect(response.body).toBeDefined();


    })

    //update applicant test
    it('PUT /api/user/update_applicant/:id | Update applicant profile', async () => {
        const response = await request(app)
            .put(`/api/user/update_applicant/${applicantId}`)
            .set('Authorization', `Bearer ${applicantToken}`)
            .field('name', 'Updated Name')
            .field('email', 'updatedemail@example.com')
            .field('password', 'newpassword123')
            .attach('userImage', path.resolve(__dirname, 'test.png'))
            .expect(200);

        // Check that the response is successful
        expect(response.body.success).toBe(true);
        expect(response.body.message).toEqual('User Updated');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.name).toEqual('Updated Name');
        expect(response.body.user.email).toEqual('updatedemail@example.com');
        expect(response.body.user.password).not.toEqual('newpassword123'); // Password should be hashed
        expect(response.body.user.userImage).toBeDefined(); // Ensure image is uploaded
    });


    //-----------JOB TEST-----------//

    //get all jobs test
    it('GET /api/job/get_all_open_jobs | fetch all open jobs', async () => {
        const response = await request(app).get('/api/job/get_all_open_jobs').set('authorization', `Bearer ${applicantToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.message).toEqual("Jobs fetched successfully");
    })

    // Test for creating a job
    it('POST /api/job/create | Create a new job', async () => {
        const response = await request(app)
            .post('/api/job/create_job')
            .set('authorization', `Bearer ${employerToken}`)
            .send({
                title: "Software Developer",
                workType: "Remote",
                description: "We are looking for a skilled software developer with a minium 3 years of expirience. The candidate should be skillfull in Java and object oriented programming",
                skills: "JavaScript, Node.js, React",
                qualification: "Bachelor's degree in Computer Science",
                status: 'Open',
                employer: employerId
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toEqual("Job created successfully");
        expect(response.body.job).toBeDefined();
        expect(response.body.job.title).toEqual("Software Developer");
        expect(response.body.job.workType).toEqual("Remote");
        expect(response.body.job.employer).toBeDefined(); // Ensure the job is linked to an employer
        expect(response.body.message).toBeDefined();

    });

    // Test for fetching a job by ID
    it('GET /api/job/get_job_details/:id | Get a job by ID', async () => {
        const response = await request(app)
            .get(`/api/job/get_job_details/${jobId}`)
            .set('authorization', `Bearer ${applicantToken}`)

        if (response.body.success) {
            expect(response.statusCode).toBe(201);
            expect(response.body.job).toBeDefined();
            expect(response.body.job.title).toEqual("Senior MERN Developer");
            expect(response.body.job.workType).toEqual("Remote");
            expect(response.body.job.employer).toBeDefined(); // Ensure employer details are populated
        } else {
            expect(response.body.message).toEqual('Job not found');
        }
    });


    // Test for fetching applicants for a specific job
    it('GET /api/job/:jobId | Get applicants for a job', async () => {
        const response = await request(app)
            .get(`/api/job/${jobId}`)
            .set('authorization', `Bearer ${employerToken}`)


        expect(response.statusCode).toBe(200);
        expect(response.body.message).toEqual('Applicants fetched successfully');
        expect(response.body.applicants).toBeInstanceOf(Array);
        expect(response.body.applicants.length).toBeGreaterThan(0);

        // Additional checks for applicant fields
        const applicant = response.body.applicants[0];
        expect(applicant.name).toBeDefined();
        expect(applicant.email).toBeDefined();
        expect(applicant.userImage).toBeDefined();
        expect(applicant.resumes).toBeInstanceOf(Array);
        expect(applicant.applications).toBeInstanceOf(Array);

    });

    //-----------RESUME TEST-----------//

    // Test for fetching resumes with valid user
    it('GET /api/resume/get_all_resume | Get resumes by user', async () => {
        const response = await request(app)
            .get('/api/resume/get_all_resume')
            .set('authorization', `Bearer ${applicantToken}`)
            .query({ page: 1, limit: 5 })

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.resumes).toBeInstanceOf(Array);
        expect(response.body.totalResumes).toBeDefined();
        expect(response.body.currentPage).toBe("1");
        expect(response.body.totalPages).toBeDefined();

        // Additional checks for fields within resumes
        if (response.body.resumes.length > 0) {
            const resume = response.body.resumes[0];
            expect(resume.applicant).toBeDefined();
            expect(resume._id).toBeDefined();
        }
    });

    //-----------APPLICATION TEST-----------//

    it('GET /api/application/get_employer_applications| Get applications of employer', async () => {
        const response = await request(app)
            .get('/api/applications/get_employer_applications')
            .set('authorization', `Bearer ${employerToken}`)
            .query({ page: 1, limit: 5 });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        // expect(response.body.applications[0].job._id).toEqual(jobId.toString());
        expect(response.body.totalPages).toBe(1);
    });


});