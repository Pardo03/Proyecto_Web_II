const express = require("express");
const { register, validateEmail } = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.put("/validate", verifyToken, validateEmail); // Esta protegido por JWT

module.exports = router;
