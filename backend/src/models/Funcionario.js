// models/Funcionario.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const funcionarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    telefone: {
        type: String, // String é melhor para números de telefone (inclui DDD, +55, etc)
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Garante que não haja dois emails iguais
        lowercase: true, // Converte para minúsculas
        trim: true,
    },
    senha: {
        type: String,
        required: true,
        select: false, // Não retorna a senha em queries 'find' por padrão
    },
    cargo: {
        type: String,
        required: true,
        enum: ['caixa', 'supervisor', 'gerente'],
        default: 'caixa',
    },
}, {
    timestamps: true
});

// Middleware (hook) do Mongoose: Executa ANTES de salvar ('pre-save')
// Usamos 'function' e não arrow function para ter acesso ao 'this' (o documento)
funcionarioSchema.pre('save', async function (next) {
    // Se a senha não foi modificada (ex: atualização de nome), pular
    if (!this.isModified('senha')) {
        return next();
    }

    // Criptografa a nova senha
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Método de instância para comparar a senha digitada com a senha no banco
funcionarioSchema.methods.compararSenha = async function (senhaDigitada) {
    // 'this.senha' é a senha criptografada do documento
    return await bcrypt.compare(senhaDigitada, this.senha);
};

module.exports = mongoose.model('Funcionario', funcionarioSchema);