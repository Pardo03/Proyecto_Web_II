const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const uploadFirma = require("../middlewares/uploadFirma");
const {
  createDeliveryNote,
  getAllDeliveryNotes,
  getDeliveryNoteById,
  generatePDFDeliveryNote,
  signDeliveryNote,
  deleteDeliveryNote,
} = require("../controllers/deliveryNoteController");

/**
 * @swagger
 * tags:
 *   name: DeliveryNotes
 *   description: Gestión de albaranes
 */

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un nuevo albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proyecto:
 *                 type: string
 *                 description: ID del proyecto asociado
 *               cliente:
 *                 type: string
 *                 description: ID del cliente asociado
 *               items:
 *                 type: array
 *                 description: Lista de horas o materiales
 *                 items:
 *                   type: object
 *                   properties:
 *                     tipo:
 *                       type: string
 *                       enum: [hora, material]
 *                     descripcion:
 *                       type: string
 *                     cantidad:
 *                       type: number
 *                     precioUnitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *       400:
 *         description: Datos incompletos
 */
router.post("/", verifyToken, createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Listar todos los albaranes
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de albaranes del usuario
 */
router.get("/", verifyToken, getAllDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: Datos del albarán
 *       404:
 *         description: Albarán no encontrado
 */
router.get("/:id", verifyToken, getDeliveryNoteById);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Descargar PDF de un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: PDF generado
 *       404:
 *         description: Albarán no encontrado
 */
router.get("/pdf/:id", verifyToken, generatePDFDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/sign/{id}:
 *   patch:
 *     summary: Firmar un albarán subiendo la imagen de la firma
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firma:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente
 *       400:
 *         description: Error al subir la firma
 */
router.patch("/sign/:id", verifyToken, uploadFirma.single("firma"), signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Eliminar un albarán (solo si no está firmado)
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del albarán
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *       403:
 *         description: No permitido eliminar un albarán firmado
 *       404:
 *         description: Albarán no encontrado
 */
router.delete("/:id", verifyToken, deleteDeliveryNote);

module.exports = router;
