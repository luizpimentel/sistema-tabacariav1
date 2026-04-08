// controllers/vendasController.js
const Venda = require('../models/Venda');
const Produto = require('../models/Produto');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

/**
 * @desc    Registrar uma nova venda
 * @route   POST /api/vendas
 * @access  Privado (requer 'proteger')
 */
exports.registrarVenda = asyncHandler(async (req, res) => {
    const { itens, pagamentos, desconto } = req.body;

    // Lógica de Venda requer uma Transação do MongoDB
    // Isso garante que TODAS as operações (baixar estoque, criar venda)
    // ou funcionem ou falhem juntas (Atomicidade).
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let subtotal = 0;
        const detalhesItens = [];

        // 1. Verificar estoque e calcular subtotal (DENTRO da transação)
        for (const item of itens) {
            const produto = await Produto.findById(item.produtoId).session(session);

            if (!produto) {
                throw new Error(`Produto com ID ${item.produtoId} não encontrado.`);
            }
            if (produto.quantidadeEstoque < item.quantidade) {
                throw new Error(`Estoque insuficiente para o produto: ${produto.nome}.`);
            }

            // 2. Dar baixa no estoque
            produto.quantidadeEstoque -= item.quantidade;
            await produto.save({ session });

            // 3. Adicionar ao subtotal e preparar detalhes da venda
            subtotal += item.quantidade * produto.precoVenda;
            detalhesItens.push({
                produto: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: produto.precoVenda,
                precoCustoUnitario: produto.precoCusto,
            });
        }

        // 4. Calcular desconto e total final
        let totalFinal = subtotal;
        let valorDesconto = 0;

        if (desconto && desconto.valor > 0) {
            if (desconto.tipo === 'percentual') {
                valorDesconto = (subtotal * desconto.valor) / 100;
            } else if (desconto.tipo === 'fixo') {
                valorDesconto = desconto.valor;
            }
            totalFinal = subtotal - valorDesconto;
        }

        if (totalFinal < 0) {
            throw new Error('O valor do desconto não pode ser maior que o subtotal.');
        }

        // 5. Verificar se o total pago bate com o total final
        const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0);
        // Usar margem de erro para centavos (ex: 0.01)
        if (Math.abs(totalPago - totalFinal) > 0.01) {
            throw new Error(`O total pago (R$ ${totalPago.toFixed(2)}) não corresponde ao total final (R$ ${totalFinal.toFixed(2)}).`);
        }

        // 6. Criar o registro da venda (DENTRO da transação)
        const novaVenda = (await Venda.create([{
            itens: detalhesItens,
            subtotal,
            desconto: (desconto && desconto.valor > 0) ? desconto : null,
            totalFinal,
            pagamentos,
            funcionario: req.funcionario._id,
        }], { session }))[0];

        // Popula os dados para o alerta ficar bonito (com nome do vendedor)
        await novaVenda.populate('funcionario', 'nome');

        // 7. Se tudo deu certo, COMITAR a transação
        await session.commitTransaction();

        // Emite o evento 'nova_venda' para todos os conectados (Dashboard do Gerente)
        if (req.io) {
            req.io.emit('nova_venda', {
                mensagem: `Nova venda de R$ ${totalFinal.toFixed(2)}!`,
                vendedor: novaVenda.funcionario.nome,
                valor: totalFinal,
                data: new Date()
            });
        }

        res.status(201).json(novaVenda);

    } catch (error) {
        // 8. Se algo deu errado, ABORTAR a transação (desfazer as baixas de estoque)
        await session.abortTransaction();
        res.status(400); // Bad Request
        throw new Error(error.message); // Lança o erro (será pego pelo errorHandler)

    } finally {
        // 9. Encerrar a sessão em qualquer caso
        session.endSession();
    }
});

/**
 * @desc    Listar todas as vendas
 * @route   GET /api/vendas
 * @access  Privado (requer 'proteger')
 */
exports.listarVendas = asyncHandler(async (req, res) => {
    const vendas = await Venda.find()
        .populate('itens.produto', 'nome') // Popula o nome do produto
        .populate('funcionario', 'nome') // Popula o nome do funcionário
        .sort({ createdAt: -1 }); // Mais recentes primeiro

    res.status(200).json(vendas);
});