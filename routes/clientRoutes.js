const express = require("express");
const router = express.Router();
const { createClient, updateClient, getAllClients, getClientById } = require("../controllers/clientController");
const verifyToken = require("../middlewares/authMiddleware");

router.post("/", verifyToken, createClient);
router.put("/:id", verifyToken, updateClient);
router.get("/", verifyToken, getAllClients);
router.get("/:id", verifyToken, getClientById)

module.exports = router;
