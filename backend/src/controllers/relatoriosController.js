// controllers/relatoriosController.js
const Venda = require('../models/Venda');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Gerar relatório de vendas por período
 * @route   GET /api/relatorios/vendas-por-periodo?dataInicio=AAAA-MM-DD&dataFim=AAAA-MM-DD
 * @access  Privado (Gerente, Supervisor)
 */
exports.getVendasPorPeriodo = asyncHandler(async (req, res) => {
    const { dataInicio, dataFim } = req.query;

    // Converte as strings de data para objetos Date
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999); // Garante que o dia final seja incluído por completo

    // Pipeline de Agregação do MongoDB
    const relatorio = await Venda.aggregate([
        // Estágio 1: $match - Filtra documentos dentro do período de datas
        {
            $match: {
                createdAt: {
                    $gte: inicio, // Maior ou igual (Greater than or equal)
                    $lte: fim,    // Menor ou igual (Less than or equal)
                },
            },
        },
        // Estágio 2: $group - Agrupa os resultados para calcular os totais
        {
            $group: {
                _id: null, // Agrupa todos os documentos em um único resultado
                faturamentoBruto: { $sum: '$subtotal' },
                totalDescontos: { $sum: '$desconto.valor' }, // Soma apenas se o desconto existir
                faturamentoLiquido: { $sum: '$totalFinal' },
                numeroDeVendas: { $sum: 1 }, // Conta o número de vendas
            },
        },
        // Estágio 3: $project - Formata a saída
        {
            $project: {
                _id: 0, // Remove o campo _id
                faturamentoBruto: 1, // 1 = manter o campo
                totalDescontosAplicados: '$totalDescontos',
                faturamentoLiquido: 1,
                quantidadeDeVendas: '$numeroDeVendas',
                ticketMedio: {
                    // $cond para evitar divisão por zero
                    $cond: [
                        { $eq: ['$numeroDeVendas', 0] },
                        0,
                        { $divide: ['$faturamentoLiquido', '$numeroDeVendas'] }
                    ]
                }
            }
        }
    ]);

    // Se não houver vendas, o 'aggregate' retorna um array vazio
    if (relatorio.length === 0) {
        return res.status(200).json({
            faturamentoBruto: 0,
            totalDescontosAplicados: 0,
            faturamentoLiquido: 0,
            quantidadeDeVendas: 0,
            ticketMedio: 0,
            message: 'Nenhuma venda encontrada para o período informado.'
        });
    }

    res.status(200).json(relatorio[0]); // Retorna o primeiro (e único) objeto
});

/**
 * @desc    Gerar relatório de lucratividade por período
 * @route   GET /api/relatorios/lucratividade-por-periodo?dataInicio=AAAA-MM-DD&dataFim=AAAA-MM-DD
 * @access  Privado (Gerente)
 */
exports.getLucratividadePorPeriodo = asyncHandler(async (req, res) => {
    const { dataInicio, dataFim } = req.query;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const relatorio = await Venda.aggregate([
        // 1. $match - Filtra vendas pelo período
        {
            $match: {
                createdAt: { $gte: inicio, $lte: fim },
            },
        },
        // 2. $unwind - "Desmonta" o array de itens.
        // Transforma cada item de cada venda em um documento separado.
        {
            $unwind: '$itens',
        },
        // 3. $group - Agrupa tudo para somar os custos e faturamento dos itens
        {
            $group: {
                _id: null,
                faturamentoBruto: { $sum: { $multiply: ['$itens.precoUnitario', '$itens.quantidade'] } },
                custoTotal: { $sum: { $multiply: ['$itens.precoCustoUnitario', '$itens.quantidade'] } },
                vendasUnicas: { $addToSet: '$_id' } // Coleta IDs de vendas únicas
            },
        },
        // 4. $project - Formata a saída e calcula o lucro
        {
            $project: {
                _id: 0,
                faturamentoBruto: 1,
                custoTotal: 1,
                lucroBruto: { $subtract: ['$faturamentoBruto', '$custoTotal'] },
                quantidadeDeVendas: { $size: '$vendasUnicas' },
                margemDeLucro: {
                    $cond: [
                        { $eq: ['$faturamentoBruto', 0] },
                        0,
                        {
                            $multiply: [
                                { $divide: [{ $subtract: ['$faturamentoBruto', '$custoTotal'] }, '$faturamentoBruto'] },
                                100
                            ]
                        }
                    ]
                }
            }
        }
    ]);

    if (relatorio.length === 0) {
        return res.status(200).json({
            faturamentoBruto: 0,
            custoTotal: 0,
            lucroBruto: 0,
            quantidadeDeVendas: 0,
            margemDeLucro: 0,
            message: 'Nenhuma venda encontrada para o período informado.'
        });
    }

    res.status(200).json(relatorio[0]);
});

/**
 * @desc    Gerar relatório de produtos mais vendidos por período
 * @route   GET /api/relatorios/produtos-mais-vendidos?dataInicio=AAAA-MM-DD&dataFim=AAAA-MM-DD
 * @access  Privado (Gerente, Supervisor)
 */
exports.getProdutosMaisVendidos = asyncHandler(async (req, res) => {
    const { dataInicio, dataFim } = req.query;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const relatorio = await Venda.aggregate([
        // 1. $match - Filtra vendas pelo período
        {
            $match: { createdAt: { $gte: inicio, $lte: fim } }
        },
        // 2. $unwind - "Desmonta" o array de itens
        {
            $unwind: '$itens'
        },
        // 3. $group - Agrupa os itens pelo ID do produto
        {
            $group: {
                _id: '$itens.produto', // Agrupa pelo ID do produto
                quantidadeTotalVendida: { $sum: '$itens.quantidade' },
                faturamentoTotal: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
            }
        },
        // 4. $sort - Ordena pelo faturamento, do maior para o menor
        {
            $sort: { faturamentoTotal: -1 } // -1 para ordem decrescente
        },
        // 5. $lookup - Busca os detalhes do produto (JOIN)
        {
            $lookup: {
                from: 'produtos', // Coleção 'produtos'
                localField: '_id', // Campo local (_id do grupo, que é o ID do produto)
                foreignField: '_id', // Campo na coleção 'produtos'
                as: 'detalhesDoProduto' // Nome do novo array
            }
        },
        // 6. $project - Formata a saída final
        {
            $project: {
                _id: 0,
                produtoId: '$_id',
                // $arrayElemAt[0] pega o primeiro (e único) item do $lookup
                nomeDoProduto: { $arrayElemAt: ['$detalhesDoProduto.nome', 0] },
                quantidadeTotalVendida: 1,
                faturamentoTotal: 1
            }
        }
    ]);

    res.status(200).json(relatorio);
});