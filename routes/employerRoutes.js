const employerControllers = require("../controllers/employerControllers");

const router = require('express').Router();

//Creating user registration route
router.post("/register", employerControllers.register)

//Creationg user login route
router.post("/login", employerControllers.login)


//Creationg employer update route
router.put("/update_employer/:id", employerControllers.updateEmployer)

module.exports = router;