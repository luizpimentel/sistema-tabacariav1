// models/Fornecedor.js
const mongoose = require('mongoose');

const fornecedorSchema = new mongoose.Schema({
    nomeFantasia: {
        type: String,
        required: true,
        trim: true,
    },
    razaoSocial: {
        type: String,
        required: true,
        trim: true,
    },
    cnpj: {
        type: String, // String para poder formatar/validar com pontos e traços
        required: true,
        unique: true,
    },
    contato: {
        telefone: String,
        email: String,
        nome: String,
    },
    endereco: {
        logradouro: String,
        numero: String,
        cidade: String,
        estado: String,
        cep: String,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Fornecedor', fornecedorSchema);