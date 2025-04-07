const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const {
  createDeliveryNote,
  getAllDeliveryNotes,
  getDeliveryNoteById,
} = require("../controllers/deliveryNoteController");

// Crear albarán (simple o con múltiples entradas)
router.post("/", verifyToken, createDeliveryNote);

// Obtener todos los albaranes del usuario o su empresa
router.get("/", verifyToken, getAllDeliveryNotes);

// Obtener un albarán por su ID (con populate)
router.get("/:id", verifyToken, getDeliveryNoteById);

module.exports = router;
