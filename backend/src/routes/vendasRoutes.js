// routes/vendasRoutes.js
const express = require('express');
const router = express.Router();
const vendasController = require('../controllers/vendasController');
const { proteger } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// Prefix: /api

// @route   POST /api/vendas
router.post(
    '/vendas',
    proteger, // Apenas funcionários logados podem registrar vendas
    [
        body('itens').isArray({ min: 1 }).withMessage('A venda deve conter pelo menos um item.'),
        body('itens.*.produtoId').isMongoId().withMessage('Cada item deve ter um ID de produto válido.'),
        body('itens.*.quantidade').isInt({ gt: 0 }).withMessage('A quantidade deve ser maior que zero.'),

        body('pagamentos').isArray({ min: 1 }).withMessage('A venda deve conter pelo menos um pagamento.'),
        body('pagamentos.*.metodo')
            .isIn(['dinheiro', 'pix', 'cartao_debito', 'cartao_credito'])
            .withMessage('Método de pagamento inválido.'),
        body('pagamentos.*.valor').isFloat({ gt: 0 }).withMessage('O valor do pagamento deve ser maior que zero.'),

        // Validação de desconto (opcional)
        body('desconto').optional(),
        body('desconto.tipo')
            .if(body('desconto').exists())
            .isIn(['percentual', 'fixo'])
            .withMessage('O tipo de desconto é inválido.'),
        body('desconto.valor')
            .if(body('desconto').exists())
            .isFloat({ gt: 0 })
            .withMessage('O valor do desconto deve ser maior que zero.')
    ],
    validate,
    vendasController.registrarVenda
);

// @route   GET /api/vendas
router.get(
    '/vendas',
    proteger, // Apenas funcionários logados
    vendasController.listarVendas
);

module.exports = router;