const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const validateClientId = [
  param("id")
    .custom(id => mongoose.Types.ObjectId.isValid(id))
    .withMessage("ID de cliente inválido"),
];

const createClientValidator = [
  body("email")
    .isEmail().withMessage("Email inválido"),

  body("nombre")
    .notEmpty().withMessage("El nombre del cliente es obligatorio"),

  body("telefono")
    .optional().isString().withMessage("El teléfono debe ser una cadena"),

  body("direccion")
    .optional().isString().withMessage("La dirección debe ser una cadena")
];

const updateClientValidator = [
  body("nombre")
    .optional().notEmpty().withMessage("El nombre no puede estar vacío"),

  body("telefono")
    .optional().isString().withMessage("El teléfono debe ser una cadena"),

  body("direccion")
    .optional().isString().withMessage("La dirección debe ser una cadena"),

  body("email")
    .optional().isEmail().withMessage("Email inválido"),
];

module.exports = {
  createClientValidator,
  updateClientValidator,
  validateClientId
};
