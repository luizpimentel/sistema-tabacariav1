// controllers/dashboardController.js
const Caixa = require('../models/Caixa');
const Venda = require('../models/Venda');
const Produto = require('../models/Produto');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Obter resumo de dados para o dashboard
 * @route   GET /api/dashboard/resumo
 * @access  Privado (Caixa, Supervisor, Gerente)
 */
exports.getDashboardResumo = asyncHandler(async (req, res) => {
    // 1. Definir o período: "Hoje"
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const fimDoDia = new Date();
    fimDoDia.setHours(23, 59, 59, 999);

    // 2. Preparar as consultas em paralelo
    const promiseStatusCaixa = Caixa.findOne({ status: 'aberto' }).populate('funcionarioAbertura', 'nome');

    const promiseResumoVendas = Venda.aggregate([
        { $match: { createdAt: { $gte: inicioDoDia, $lte: fimDoDia } } },
        {
            $group: {
                _id: null,
                faturamentoDoDia: { $sum: '$totalFinal' },
                vendasDoDia: { $sum: 1 },
            },
        },
    ]);

    const promiseEstoqueBaixo = Produto.countDocuments({
        // $expr permite comparar dois campos do mesmo documento
        $expr: { $lte: ['$quantidadeEstoque', '$estoqueMinimo'] }
    });

    // 3. Executar todas as consultas simultaneamente
    const [caixaAberto, resumoVendasArray, totalEstoqueBaixo] = await Promise.all([
        promiseStatusCaixa,
        promiseResumoVendas,
        promiseEstoqueBaixo,
    ]);

    // 4. Formatar a resposta final
    const resumoVendas = resumoVendasArray[0] || { faturamentoDoDia: 0, vendasDoDia: 0 };

    const dashboardData = {
        statusCaixa: caixaAberto ? 'aberto' : 'fechado',
        saldoCaixaAberto: caixaAberto ? caixaAberto.saldoInicial : null, // Info útil
        nomeFuncionario: caixaAberto && caixaAberto.funcionarioAbertura ? caixaAberto.funcionarioAbertura.nome : 'Sistema',
        faturamentoDoDia: resumoVendas.faturamentoDoDia,
        vendasDoDia: resumoVendas.vendasDoDia,
        produtosComEstoqueBaixo: totalEstoqueBaixo,
    };

    res.status(200).json(dashboardData);
});