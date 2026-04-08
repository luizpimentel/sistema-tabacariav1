// models/Venda.js
const mongoose = require('mongoose');

const itemVendaSchema = new mongoose.Schema({
    produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produto',
        required: true
    },
    quantidade: {
        type: Number,
        required: true,
        min: 1
    },
    precoUnitario: { // Preço de venda no momento da venda
        type: Number,
        required: true
    },
    precoCustoUnitario: { // Preço de custo no momento da venda
        type: Number,
        required: true
    }
}, { _id: false }); // _id: false para não criar IDs para subdocumentos de itens

const pagamentoSchema = new mongoose.Schema({
    metodo: {
        type: String,
        required: true,
        enum: ['dinheiro', 'pix', 'cartao_debito', 'cartao_credito'],
    },
    valor: {
        type: Number,
        required: true,
        min: 0.01
    }
}, { _id: false });

const descontoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['percentual', 'fixo'],
        required: true,
    },
    valor: {
        type: Number,
        required: true,
        min: 0.01
    },
}, { _id: false });

const vendaSchema = new mongoose.Schema({
    itens: [itemVendaSchema],
    subtotal: { // Soma dos (precoUnitario * quantidade)
        type: Number,
        required: true
    },
    desconto: { // Opcional
        type: descontoSchema,
        required: false
    },
    totalFinal: { // subtotal - desconto
        type: Number,
        required: true
    },
    pagamentos: [pagamentoSchema],
    funcionario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funcionario',
        required: true
    }
}, {
    timestamps: true // Adiciona createdAt e updatedAt
});

module.exports = mongoose.model('Venda', vendaSchema);