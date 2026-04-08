// controllers/authController.js
const asyncHandler = require('express-async-handler');
const Funcionario = require('../models/Funcionario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Função helper para gerar o token JWT
const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '12h', // Token expira em 12 horas
    });
};

/**
 * @desc    Registrar (contratar) um novo funcionário
 * @route   POST /api/auth/registrar
 * @access  Público (ou Privado/Gerente, dependendo da regra - aqui está público)
 */
exports.registrarFuncionario = asyncHandler(async (req, res) => {
    const { nome, email, senha, cargo, telefone } = req.body;

    // 1. Verifica se o email já está em uso
    const funcionarioExiste = await Funcionario.findOne({ email });
    if (funcionarioExiste) {
        res.status(400);
        throw new Error('Este email já está cadastrado.');
    }

    // 2. Cria o novo funcionário (a senha será criptografada pelo hook 'pre-save' no Model)
    const novoFuncionario = await Funcionario.create({
        nome,
        email,
        senha,
        cargo,
        telefone
    });

    // 3. Responde sem a senha
    novoFuncionario.senha = undefined;
    res.status(201).json({
        message: 'Funcionário registrado com sucesso!',
        funcionario: novoFuncionario,
    });
});

/**
 * @desc    Autenticar (fazer login) de um funcionário
 * @route   POST /api/auth/login
 * @access  Público
 */
exports.loginFuncionario = asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    // 1. Procura o funcionário pelo email e INCLUI a senha na busca
    const funcionario = await Funcionario.findOne({ email }).select('+senha');

    // 2. Verifica se o funcionário existe e se a senha está correta
    if (!funcionario || !(await bcrypt.compare(senha, funcionario.senha))) {
        res.status(401); // Unauthorized
        throw new Error('Email ou senha inválidos.');
    }

    // 3. Gera o token e envia a resposta
    const token = gerarToken(funcionario._id);
    funcionario.senha = undefined; // Remove a senha da resposta

    res.status(200).json({
        message: 'Login bem-sucedido',
        token,
        funcionario,
    });
});

/**
 * @desc    Obter perfil do usuário logado
 * @route   GET /api/auth/me
 * @access  Privado (requer 'proteger')
 */
exports.getMeuPerfil = asyncHandler(async (req, res) => {
    // O middleware 'proteger' já buscou o funcionário e o anexou em 'req.funcionario'
    const funcionario = req.funcionario;

    if (!funcionario) {
        res.status(404);
        throw new Error('Funcionário não encontrado.');
    }

    res.status(200).json(funcionario);
});

/**
 * @desc    Alterar a própria senha
 * @route   PUT /api/auth/alterar-senha
 * @access  Privado (requer 'proteger')
 */
exports.alterarMinhaSenha = asyncHandler(async (req, res) => {
    const { senhaAntiga, novaSenha } = req.body;

    // 1. Busca o funcionário logado (req.funcionario.id) e força a inclusão da senha
    const funcionario = await Funcionario.findById(req.funcionario.id).select('+senha');

    if (!funcionario) {
        res.status(404);
        throw new Error('Funcionário não encontrado.');
    }

    // 2. Compara a senha antiga digitada com a senha do banco
    const isMatch = await funcionario.compararSenha(senhaAntiga);
    if (!isMatch) {
        res.status(401);
        throw new Error('Senha antiga está incorreta.');
    }

    // 3. Atribui a nova senha (o hook 'pre-save' cuidará da criptografia)
    funcionario.senha = novaSenha;
    await funcionario.save();

    res.status(200).json({ message: 'Senha alterada com sucesso.' });
});