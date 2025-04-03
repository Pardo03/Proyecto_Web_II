const express = require("express");
const router = express.Router();
const { createClient } = require("../controllers/clientController");
const verifyToken = require("../middlewares/authMiddleware");

router.post("/", verifyToken, createClient);

module.exports = router;
