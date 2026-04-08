// routes/relatoriosRoutes.js
const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');
const { proteger, autorizar } = require('../middleware/authMiddleware');
const { query } = require('express-validator'); // Validação de query params
const { validate } = require('../middleware/validationMiddleware');

// Validação de data (usada em todas as rotas)
const validateDateQuery = [
    query('dataInicio').isISO8601().withMessage('A data de início deve estar no formato AAAA-MM-DD.'),
    query('dataFim').isISO8601().withMessage('A data de fim deve estar no formato AAAA-MM-DD.'),
    validate
];

// @route   GET /api/relatorios/vendas-por-periodo
router.get(
    '/relatorios/vendas-por-periodo',
    proteger,
    autorizar('gerente', 'supervisor'),
    validateDateQuery,
    relatoriosController.getVendasPorPeriodo
);

// @route   GET /api/relatorios/lucratividade-por-periodo
router.get(
    '/relatorios/lucratividade-por-periodo',
    proteger,
    autorizar('gerente'), // Apenas gerente vê lucratividade
    validateDateQuery,
    relatoriosController.getLucratividadePorPeriodo
);

// @route   GET /api/relatorios/produtos-mais-vendidos
router.get(
    '/relatorios/produtos-mais-vendidos',
    proteger,
    autorizar('gerente', 'supervisor'),
    validateDateQuery,
    relatoriosController.getProdutosMaisVendidos
);

module.exports = router;