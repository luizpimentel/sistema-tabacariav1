// routes/funcionariosRoutes.js
const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');
const { proteger, autorizar } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// Prefix: /api

// @route   GET /api/funcionarios
router.get(
    '/funcionarios',
    proteger,
    autorizar('gerente'), // Apenas gerentes podem listar
    funcionarioController.listarFuncionarios
);

// @route   GET /api/funcionarios/:id
router.get(
    '/funcionarios/:id',
    proteger,
    autorizar('gerente'),
    funcionarioController.buscarFuncionarioPorId
);

// @route   PUT /api/funcionarios/:id
router.put(
    '/funcionarios/:id',
    proteger,
    autorizar('gerente'),
    [
        body('nome').notEmpty().withMessage('O nome é obrigatório.'),
        body('email').isEmail().withMessage('Forneça um email válido.'),
        body('cargo').isIn(['caixa', 'gerente', 'supervisor']).withMessage('Cargo inválido.')
    ],
    validate,
    funcionarioController.atualizarFuncionario
);

// @route   DELETE /api/funcionarios/:id
router.delete(
    '/funcionarios/:id', // Corrigido de '/funcionario/:id' para '/funcionarios/:id' por padrão
    proteger,
    autorizar('gerente'),
    funcionarioController.deletarFuncionario
);

// Rota para reset de senha (Apenas Gerente)

router.put(
    '/funcionarios/:id/reset-senha',
    proteger,
    autorizar('gerente'),
    funcionarioController.resetarSenhaFuncionario
);

module.exports = router;