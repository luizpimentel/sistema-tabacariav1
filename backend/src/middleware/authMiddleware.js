// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Funcionario = require('../models/Funcionario');
const asyncHandler = require('express-async-handler');
require('dotenv').config();

/**
 * @desc Middleware para proteger rotas. Verifica se o token JWT é válido.
 * Anexa o funcionário logado ao objeto 'req' (req.funcionario).
 */
exports.proteger = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Verifica se o token está no header 'Authorization' e se começa com 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Extrai o token (remove o 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // 3. Verifica e decodifica o token usando a chave secreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Busca o funcionário pelo ID contido no token
      //    '.select('-senha')' garante que a senha não seja trazida
      req.funcionario = await Funcionario.findById(decoded.id).select('-senha');

      if (!req.funcionario) {
        res.status(401);
        throw new Error('Não autorizado, funcionário não encontrado.');
      }

      // 5. Continua para o próximo middleware ou controller
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Não autorizado, token inválido.');
    }
  }

  // Se não houver token, retorna erro
  if (!token) {
    res.status(401);
    throw new Error('Não autorizado, token não encontrado.');
  }
});

/**
 * @desc Middleware de autorização por cargo.
 * Verifica se o cargo do funcionário (anexado pelo middleware 'proteger')
 * está na lista de cargos permitidos.
 * @param  {...String} cargos - Lista de cargos permitidos (ex: 'gerente', 'supervisor')
 */
exports.autorizar = (...cargos) => {
  return (req, res, next) => {
    // Este middleware DEVE rodar DEPOIS do 'proteger'
    if (!req.funcionario || !cargos.includes(req.funcionario.cargo)) {
      // 403 Forbidden: O usuário está autenticado, mas não tem permissão
      return res.status(403).json({
        message: 'Acesso negado. Você não tem permissão para realizar esta ação.',
      });
    }
    // Permissão concedida
    next();
  };
};