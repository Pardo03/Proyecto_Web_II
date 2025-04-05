const express = require("express");
const router = express.Router();
const {
  createProject,
  updateProject,
  getAllProjects,
  getProjectById,
  archiveProject,
  recoverProject,
  getArchivedProjects,
  deleteProject,
} = require("../controllers/projectController");
const verifyToken = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Endpoints para gestión de proyectos
 */

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Crear un nuevo proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, clienteId]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Proyecto Alpha
 *               descripcion:
 *                 type: string
 *                 example: Instalación de sistema
 *               clienteId:
 *                 type: string
 *                 example: 60c72b2f9b1e8c23d8a2e999
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *       409:
 *         description: Ya existe un proyecto con ese nombre
 */
router.post("/", verifyToken, createProject);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     summary: Obtener proyectos archivados del usuario o su empresa
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 */
router.get("/archived", verifyToken, getArchivedProjects);

/**
 * @swagger
 * /api/project/archive/{id}:
 *   patch:
 *     summary: Archivar un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto a archivar
 *     responses:
 *       200:
 *         description: Proyecto archivado correctamente
 *       404:
 *         description: Proyecto no encontrado o ya archivado
 */
router.patch("/archive/:id", verifyToken, archiveProject);

/**
 * @swagger
 * /api/project/recover/{id}:
 *   patch:
 *     summary: Recuperar un proyecto archivado
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto a recuperar
 *     responses:
 *       200:
 *         description: Proyecto recuperado correctamente
 *       404:
 *         description: Proyecto no encontrado o no archivado
 */
router.patch("/recover/:id", verifyToken, recoverProject);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Editar un proyecto existente
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto a editar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Proyecto Renovado
 *               descripcion:
 *                 type: string
 *                 example: Proyecto actualizado con nuevos objetivos
 *     responses:
 *       200:
 *         description: Proyecto actualizado correctamente
 *       404:
 *         description: Proyecto no encontrado
 *       409:
 *         description: Nombre duplicado para este cliente
 */
router.put("/:id", verifyToken, updateProject);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: Obtener todos los proyectos del usuario o su compañía
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos
 */
router.get("/", verifyToken, getAllProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Obtener un proyecto por su ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto
 *     responses:
 *       200:
 *         description: Proyecto encontrado
 *       404:
 *         description: Proyecto no encontrado o sin permisos
 */
router.get("/:id", verifyToken, getProjectById);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Eliminar un proyecto (soft o hard delete)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del proyecto
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: "true (por defecto) para soft delete, false para eliminar permanentemente"
 *     responses:
 *       200:
 *         description: Proyecto eliminado correctamente
 *       404:
 *         description: Proyecto no encontrado
 */
router.delete("/:id", verifyToken, deleteProject);

module.exports = router;
