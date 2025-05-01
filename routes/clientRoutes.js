const express = require("express");
const router = express.Router();
const {
  createClient,
  updateClient,
  getAllClients,
  getClientById,
  archiveClient,
  deleteClient,
  getArchivedClients,
  recoverClient
} = require("../controllers/clientController");
const verifyToken = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validatorMiddleware");
const {
  createClientValidator,
  updateClientValidator,
  validateClientId
} = require("../validators/clientValidator");

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Endpoints para gestión de clientes
 */

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Crear cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Cliente S.L.
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *               ciudad:
 *                 type: string
 *               provincia:
 *                 type: string
 *               codigoPostal:
 *                 type: string
 *               pais:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado
 *       409:
 *         description: Cliente duplicado
 */
router.post("/", verifyToken, createClientValidator, validate, createClient);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: Obtener todos los clientes del usuario o su compañía
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get("/", verifyToken, getAllClients);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: Obtener clientes archivados
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 */
router.get("/archived", verifyToken, getArchivedClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 */
router.get("/:id", verifyToken, validateClientId, validate, getClientById);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Editar cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 */
router.put("/:id", verifyToken, validateClientId, updateClientValidator, validate, updateClient);

/**
 * @swagger
 * /api/client/archive/{id}:
 *   patch:
 *     summary: Archivar cliente (soft delete)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente archivado correctamente
 */
router.patch("/archive/:id", verifyToken, validateClientId, validate, archiveClient);

/**
 * @swagger
 * /api/client/recover/{id}:
 *   patch:
 *     summary: Recuperar cliente archivado
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente recuperado
 */
router.patch("/recover/:id", verifyToken, validateClientId, validate, recoverClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Eliminar cliente (soft o hard)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: Soft delete por defecto (true)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado
 */
router.delete("/:id", verifyToken, validateClientId, validate, deleteClient);

module.exports = router;
