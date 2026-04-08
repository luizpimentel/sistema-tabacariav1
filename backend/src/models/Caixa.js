const mongoose = require('mongoose');

const movimentacaoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['sangria', 'suprimento'],
        required: true
    },
    valor: {
        type: String,
        required: true
    },
    motivo: {
        type: String,
        required: true
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funcionario'
    },
    horario: {
        type: Date,
        default: Date.now
    }
});

const caixaSchema = new mongoose.Schema({
    dataAbertura: {
        type: Date,
        required: true,
        default: Date.now,
    },
    dataFechamento: {
        type: Date,
    },
    funcionarioAbertura: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funcionario',
        required: true,
    },
    funcionarioFechamento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funcionario',
    },

    /** Totais */
    vendaCartoes: {
        type: Number,
        default: 0
    },
    vendaPix: {
        type: Number,
        default: 0
    },
    vendaDinheiro: {
        type: Number,
        default: 0
    },
    totalSangrias: {
        type: Number,
        default: 0
    },
    totalSuprimentos: {
        type: Number,
        default: 0
    },
    movimentacoes: [movimentacaoSchema],
    saldoInicial: {
        type: Number,
        required: true,
    },
    saldoFinalCalculado: { // Saldo final no sistema
        type: Number,
    },
    saldoFinalInformado: { // Saldo final na gaveta
        type: Number,
    },
    diferenca: { // (Informado - Calculado)
        type: Number,
    },
    status: {
        type: String,
        required: true,
        enum: ['aberto', 'fechado'],
        default: 'aberto',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Caixa', caixaSchema);