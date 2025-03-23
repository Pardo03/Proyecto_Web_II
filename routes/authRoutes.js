const express = require("express");
const { register, validateEmail, login, updatePersonalData, updateCompanyData, uploadLogo, getMe, deleteMe } = require("../controllers/authController");
const verifyToken = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.post("/register", register);
router.put("/validate", verifyToken, validateEmail); // Esta protegido por JWT
router.post("/login", login);
router.put("/personal", verifyToken, updatePersonalData); 
router.patch("/company", verifyToken, updateCompanyData);
router.patch("/logo", verifyToken, upload.single("logo"), uploadLogo); // Para subir la imagen del logo
router.get("/me", verifyToken, getMe);
router.delete("/delete", verifyToken, deleteMe);


module.exports = router;
