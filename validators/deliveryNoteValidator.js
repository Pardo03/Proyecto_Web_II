const { body } = require("express-validator");

const createDeliveryNoteValidator = [
  body("proyecto")
    .notEmpty().withMessage("El proyecto es obligatorio")
    .isMongoId().withMessage("El ID del proyecto no es válido"),

  body("cliente")
    .notEmpty().withMessage("El cliente es obligatorio")
    .isMongoId().withMessage("El ID del cliente no es válido"),

  body("items")
    .isArray({ min: 1 }).withMessage("Debe incluir al menos un item"),

  body("items.*.tipo")
    .notEmpty().withMessage("El tipo del item es obligatorio")
    .isIn(["material", "hora"]).withMessage("El tipo debe ser 'material' o 'hora'"),

  body("items.*.descripcion")
    .notEmpty().withMessage("La descripción del item es obligatoria"),

  body("items.*.cantidad")
    .notEmpty().withMessage("La cantidad del item es obligatoria")
    .isNumeric().withMessage("La cantidad debe ser un número"),

  body("items.*.precioUnitario")
    .notEmpty().withMessage("El precio unitario del item es obligatorio")
    .isNumeric().withMessage("El precio unitario debe ser un número"),
];

const { param } = require("express-validator");

const signDeliveryNoteValidator = [
  param("id").isMongoId().withMessage("El ID del albarán no es válido")
];

module.exports = {
  createDeliveryNoteValidator,
  signDeliveryNoteValidator,
};


module.exports = {
  createDeliveryNoteValidator,
  signDeliveryNoteValidator,
};
