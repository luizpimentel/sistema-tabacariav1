const express = require('express');
const router = express.Router();
const produtosController = require('../controllers/produtosController');
const upload = require('../config/cloudinaryConfig');
const { proteger, autorizar } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// Prefix: /api

// @route   POST /api/produtos
router.post(
    '/produtos',
    proteger,
    autorizar('gerente', 'supervisor'),
    upload.single('imagem'),
    [
        body('nome').notEmpty().withMessage('O nome do produto é obrigatório.'),
        body('precoVenda').isFloat({ min: 0.01 }).withMessage('O preço de venda deve ser maior que zero.'),
        body('precoCusto').isFloat({ min: 0 }).withMessage('O preço de custo deve ser um número positivo.'),
        body('quantidadeEstoque').isInt({ min: 0 }).withMessage('O estoque deve ser um número inteiro positivo.')
    ],
    validate,
    produtosController.criarProduto
);

// @route   GET /api/produtos
router.get(
    '/produtos',
    proteger,
    produtosController.listarTodosProdutos
);

// @route   GET /api/produtos/alerta-estoque
router.get(
    '/produtos/alerta-estoque',
    proteger,
    autorizar('gerente', 'supervisor'),
    produtosController.listarProdutosComEstoqueBaixo
);

// @route   GET /api/produtos/:id
router.get(
    '/produtos/:id',
    proteger,
    produtosController.buscarProdutoPorId
);

// @route   PUT /api/produtos/:id
router.put(
    '/produtos/:id',
    proteger,
    autorizar('gerente', 'supervisor'),
    // CORREÇÃO AQUI: O upload subiu para vir antes das validações
    upload.single('imagem'),
    [
        body('nome').optional().notEmpty().withMessage('O nome não pode ser vazio.'),
        body('precoVenda').optional().isFloat({ min: 0.01 }).withMessage('O preço de venda deve ser válido.')
    ],
    validate,
    produtosController.atualizarProduto
);

// @route   DELETE /api/produtos/:id
router.delete(
    '/produtos/:id',
    proteger,
    autorizar('gerente'),
    produtosController.deletarProduto
);

module.exports = router;