const express = require("express");
const router = express.Router();
const { createClient, updateClient, getAllClients, getClientById, archiveClient, deleteClient, getArchivedClients, recoverClient } = require("../controllers/clientController");
const verifyToken = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getAllClients);
router.get("/archived", verifyToken, getArchivedClients);
router.get("/:id", verifyToken, getClientById);
router.post("/", verifyToken, createClient);
router.put("/:id", verifyToken, updateClient);
router.patch("/archive/:id", verifyToken, archiveClient);
router.patch("/recover/:id", verifyToken, recoverClient);
router.delete("/:id", verifyToken, deleteClient);


module.exports = router;
