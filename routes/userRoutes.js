const userControllers = require("../controllers/userControllers");

const router = require('express').Router();

//Creating user registration route
router.post("/register", userControllers.register)

//Creationg user login route
router.post("/login", userControllers.login)

//Creationg user update route
router.put("/update_applicant/:id", userControllers.updateApplicant)


//Creationg route for getting current applicant
router.get("/get_current_applicant", userControllers.getCurrentApplicant)

module.exports = router;