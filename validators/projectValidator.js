const { body, param } = require("express-validator");

const createProjectValidator = [
  body("nombre")
    .notEmpty()
    .withMessage("El nombre del proyecto es obligatorio"),

  body("clienteId")
    .notEmpty()
    .withMessage("El ID del cliente es obligatorio")
    .isMongoId()
    .withMessage("El ID del cliente no es válido"),

  body("descripcion")
    .optional()
    .isString()
    .withMessage("La descripción debe ser un texto")
];

const updateProjectValidator = [
  body("nombre")
    .optional()
    .isString()
    .withMessage("El nombre debe ser un texto"),

  body("descripcion")
    .optional()
    .isString()
    .withMessage("La descripción debe ser un texto")
];

const validateProjectId = [
  param("id")
    .isMongoId()
    .withMessage("ID de proyecto no válido")
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  validateProjectId
};
