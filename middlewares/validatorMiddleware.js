const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Devuelve el primer error encontrado
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

module.exports = validateRequest;
