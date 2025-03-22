const express = require("express");
const { register, validateEmail, login, updatePersonalData, updateCompanyData } = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware"); 

const router = express.Router();

router.post("/register", register);
router.put("/validate", verifyToken, validateEmail); // Esta protegido por JWT
router.post("/login", login);
router.put("/personal", verifyToken, updatePersonalData); 
router.patch("/company", verifyToken, updateCompanyData);

module.exports = router;
