// models/Produto.js
const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  imagemUrl: {
    type: String,
    default: 'https://placehold.co/600x400/png?text=Sem%20Imagem',
  },
  precoVenda: {
    type: Number,
    required: true,
    min: 0
  },
  precoCusto: {
    type: Number,
    required: true,
    min: 0
  },
  quantidadeEstoque: {
    type: Number,
    default: 0,
    min: 0
  },
  categoria: {
    type: String,
    trim: true
  },
  estoqueMinimo: {
    type: Number,
    default: 5,
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Produto', produtoSchema);