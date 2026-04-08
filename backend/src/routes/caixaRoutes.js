const express = require('express');
const router = express.Router();
const caixaController = require('../controllers/caixaController');
const { proteger, autorizar } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const validarValor = body('valor').isFloat({ gt: 0 }).withMessage('Valor deve ser positivo');
const validarMotivo = body('motivo').notEmpty().withMessage('Motivo é obrigatório'); 7

// @route GET /api/caixa/status
router.get(
    '/caixa/status',
    proteger,
    caixaController.verificarStatusCaixa
);

// @route   POST /api/caixa/abrir
router.post(
    '/caixa/abrir',
    proteger,
    autorizar('gerente', 'supervisor', 'caixa'),
    [
        body('saldoInicial').isFloat({ gt: -1 }).withMessage('O saldo inicial deve ser um número positivo.')
    ],
    validate,
    caixaController.abrirCaixa
);

// @route POST /api/caixa/sangria
router.post(
    '/caixa/sangria',
    proteger,
    [
        validarMotivo, validarValor
    ],
    validate,
    caixaController.realizarSangria
);

// @route POST /api/caixa/suprimento
router.post(
    '/caixa/suprimento',
    proteger,
    [validarValor, validarMotivo],
    validate,
    caixaController.realzarSuprimento
)

// @route   POST /api/caixa/fechar
router.post(
    '/caixa/fechar',
    proteger,
    autorizar('gerente', 'supervisor', 'caixa'),
    [
        body('saldoFinalInformado').isFloat({ gt: -1 }).withMessage('O saldo final informado deve ser um número positivo.')
    ],
    validate,
    caixaController.fecharCaixa
);

module.exports = router;