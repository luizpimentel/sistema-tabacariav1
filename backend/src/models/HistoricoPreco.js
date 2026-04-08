const mongoose = require('mongoose');

const historicoPrecoSchema = new mongoose.Schema({
    produto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Produto',
        required: true
    },
    precoCustoAntigo: {
        type: Number,
        required: true
    },
    precoCustoNovo: {
        type: Number,
        required: true
    },
    responsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Funcionario',
        required: true
    },
    motivo: {
        type: String,
        default: "Atualização manual",
        required: true
    }
}, {
    timestamps: true // cria p campo 'createdAt' automaticamente (data da mudança)
})

module.exports = mongoose.model('HistoricoPreco', historicoPrecoSchema);