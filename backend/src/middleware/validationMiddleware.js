// middleware/validationMiddleware.js
const { validationResult } = require('express-validator');

/**
 * @desc Middleware que "coleta" os erros de validação do express-validator.
 * Se houver erros, retorna uma resposta 400 (Bad Request).
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    // Se o array de erros não estiver vazio, houve falha na validação
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Se não houver erros, passa para o próximo middleware/controller
    next();
};

module.exports = { validate };