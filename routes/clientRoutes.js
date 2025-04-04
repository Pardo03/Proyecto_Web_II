const express = require("express");
const router = express.Router();
const { createClient, updateClient } = require("../controllers/clientController");
const verifyToken = require("../middlewares/authMiddleware");

router.post("/", verifyToken, createClient);
router.put("/:id", verifyToken, updateClient);

module.exports = router;
