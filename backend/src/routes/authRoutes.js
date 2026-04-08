// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { proteger } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

// Limita as tentativas de login e registro para prevenir força bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por IP
  message: 'Muitas tentativas. Tente novamente em 15 minutos.'
});

// @route   POST /api/auth/registrar
router.post(
  '/auth/registrar',
  authLimiter,
  [
    body('nome').notEmpty().withMessage('O nome é obrigatório.'),
    body('email').isEmail().withMessage('Forneça um email válido.'),
    body('telefone').notEmpty().withMessage('O telefone é obrigatório.'),
    body('senha').isLength({ min: 6 }).withMessage('A senha precisa ter pelo menos 6 caracteres.'),
    body('cargo').isIn(['caixa', 'supervisor', 'gerente']).withMessage('Cargo inválido.'),
  ],
  validate,
  authController.registrarFuncionario
);

// @route   POST /api/auth/login
router.post(
  '/auth/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email inválido.'),
    body('senha').notEmpty().withMessage('A senha é obrigatória.'),
  ],
  validate,
  authController.loginFuncionario
);

// @route   GET /api/auth/me
router.get(
  '/auth/me',
  proteger, // Apenas usuários logados
  authController.getMeuPerfil
);

// @route   PUT /api/auth/alterar-senha
router.put(
  '/auth/alterar-senha',
  proteger, // Apenas usuários logados
  [
    body('senhaAntiga').notEmpty().withMessage('A senha antiga é obrigatória.'),
    body('novaSenha').isLength({ min: 6 }).withMessage('A nova senha precisa ter pelo menos 6 caracteres.'),
  ],
  validate,
  authController.alterarMinhaSenha
);

module.exports = router;