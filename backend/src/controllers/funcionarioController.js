// controllers/funcionarioController.js
const Funcionario = require('../models/Funcionario');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Listar todos os funcionários
 * @route   GET /api/funcionarios
 * @access  Privado (Gerente)
 */
exports.listarFuncionarios = asyncHandler(async (req, res) => {
    // Busca todos os funcionários e exclui o campo 'senha' da resposta
    const funcionarios = await Funcionario.find().select('-senha');
    res.status(200).json(funcionarios);
});

/**
 * @desc    Buscar um funcionário por ID
 * @route   GET /api/funcionarios/:id
 * @access  Privado (Gerente)
 */
exports.buscarFuncionarioPorId = asyncHandler(async (req, res) => {
    const funcionario = await Funcionario.findById(req.params.id).select('-senha');

    if (!funcionario) {
        res.status(404);
        throw new Error('Funcionário não encontrado.');
    }

    res.status(200).json(funcionario);
});

/**
 * @desc    Atualizar um funcionário (dados cadastrais)
 * @route   PUT /api/funcionarios/:id
 * @access  Privado (Gerente)
 */
exports.atualizarFuncionario = asyncHandler(async (req, res) => {
    // Pega apenas os campos que podem ser atualizados por um gerente
    const { nome, telefone, email, cargo } = req.body;

    // Impede a atualização de senha por esta rota
    const dadosParaAtualizar = { nome, telefone, email, cargo };

    const funcionarioAtualizado = await Funcionario.findByIdAndUpdate(
        req.params.id,
        dadosParaAtualizar,
        { new: true, runValidators: true } // 'new: true' retorna o doc atualizado
    ).select('-senha');

    if (!funcionarioAtualizado) {
        res.status(404);
        throw new Error('Funcionário não encontrado para atualizar.');
    }

    res.status(200).json(funcionarioAtualizado);
});

/**
 * @desc    Deletar um funcionário
 * @route   DELETE /api/funcionarios/:id
 * @access  Privado (Gerente)
 */
exports.deletarFuncionario = asyncHandler(async (req, res) => {
    const funcionario = await Funcionario.findById(req.params.id);

    if (!funcionario) {
        res.status(404);
        throw new Error('Funcionário não encontrado para deletar.');
    }

    await funcionario.deleteOne(); // Usamos .deleteOne()

    res.status(200).json({ message: 'Funcionário deletado com sucesso.', id: req.params.id });
});

// @desc Gerente reseta a senha de um funcionário
// @route PUT /api/funcionarios/:id/reset-senha
// @access Privado (Apenas Gerente)
exports.resetarSenhaFuncionario = asyncHandler(async (req, res) => {
    const { novaSenha } = req.body;

    // 1. Validar se senha nova foi enviada
    if (!novaSenha || novaSenha.length < 6) {
        res.status(400);
        throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    // 2. buscar o funcionário pelo ID (que veio na URL)
    const funcionario = await Funcionario.findById(req.params.id);

    if (!funcionario) {
        res.status(404);
        throw new Error('Funcionário não encontrado.');
    }

    // 3. Atualizar a senha
    // O Mongoose é inteligente: ao salvar, ele vai disparar o "pre-save"
    // que criamos lá no Model e vai criptografar essa nova senha automaticamente!
    
    funcionario.senha = novaSenha;
    await funcionario.save();

    res.status(200).json({ message: `Senha de ${funcionario.nome} redefinida com sucesso.` });
});
