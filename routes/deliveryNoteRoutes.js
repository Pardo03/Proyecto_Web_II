const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const {
  createDeliveryNote,
  getAllDeliveryNotes,
  getDeliveryNoteById,
  generatePDFDeliveryNote,
  signDeliveryNote,
  deleteDeliveryNote,
} = require("../controllers/deliveryNoteController");
const uploadFirma = require("../middlewares/uploadFirma");

// Crear albarán (simple o con múltiples entradas)
router.post("/", verifyToken, createDeliveryNote);

// Obtener todos los albaranes del usuario o su empresa
router.get("/", verifyToken, getAllDeliveryNotes);

// Obtener un albarán por su ID (con populate)
router.get("/:id", verifyToken, getDeliveryNoteById);

// Generar PDF del albarán
router.get("/pdf/:id", verifyToken, generatePDFDeliveryNote);

// Para firmar el albarán
router.patch("/sign/:id", verifyToken, uploadFirma.single("firma"), signDeliveryNote);

// Para eliminar un albarán
router.delete("/:id", verifyToken, deleteDeliveryNote);

module.exports = router;
