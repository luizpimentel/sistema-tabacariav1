// controllers/caixaController.js
const Caixa = require('../models/Caixa');
const Venda = require('../models/Venda');
const asyncHandler = require('express-async-handler');

/**
 * @desc Verifica caixa aberto
 * @route GET /api/caixa/status
 * @access Privado
 */

exports.verificarStatusCaixa = asyncHandler(async (req, res) => {
    const caixaAberto = await Caixa.findOne({ status: 'aberto' });

    if (caixaAberto) {
        res.status(200).json({
            aberto: true,
            caixa: caixaAberto
        });
    } else {
        res.status(200).json({
            aberto: false,
            mensagem: "Nenhum caixa aberto no momento"
        });
    }
});

/**
 * @desc    Abrir um novo caixa
 * @route   POST /api/caixa/abrir
 * @access  Privado (Caixa, Supervisor, Gerente)
 */
exports.abrirCaixa = asyncHandler(async (req, res) => {
    const { saldoInicial } = req.body;

    // 1. Verifica se já existe um caixa aberto
    const caixaAberto = await Caixa.findOne({ status: 'aberto' });
    if (caixaAberto) {
        res.status(400);
        throw new Error('Já existe um caixa aberto.');
    }

    // 2. Cria a nova sessão de caixa
    const caixa = await Caixa.create({
        saldoInicial,
        funcionarioAbertura: req.funcionario._id, // ID vem do middleware 'proteger'
        status: 'aberto',
    });

    res.status(201).json(caixa);
});

// @desc Realizar Sangria 
exports.realizarSangria = asyncHandler(async (req, res) => {
    const { valor, motivo } = req.body;
    const caixa = await Caixa.findOne({ status: 'aberto' });

    if (!caixa) { res.status(404); throw new Error('Nenhum caixa aberto.'); }

    // Adiciona na lista de movimentações
    caixa.movimentacoes.push({
        tipo: 'sangria',
        valor: parseFloat(valor),
        motivo,
        usuario: req.funcionario._id
    });

    //Atualiza o totalizador
    caixa.totalSangrias = (caixa.totalSangrias || 0) + parseFloat(valor);

    await caixa.save();
    res.status(200).json(caixa);
});

// @desc Realizar Suprimento (entrada extra)
exports.realzarSuprimento = asyncHandler(async (req, res) => {
    const { valor, motivo } = req.body;
    const caixa = await Caixa.findOne({ status: 'aberto' });

    if (!caixa) { res.status(404); throw new Error('Nenhum caixa aberto.'); }

    caixa.movimentacoes.push({
        tipo: 'suprimento',
        valor: parseFloat(valor),
        motivo,
        usuario: req.funcionario._id
    });

    caixa.totalSuprimentos = (caixa.totalSuprimentos || 0) + parseFloat(valor);

    await caixa.save();
    res.status(200).json(caixa);
})

/**
 * @desc    Fechar o caixa atual
 * @route   POST /api/caixa/fechar
 * @access  Privado (Caixa, Supervisor, Gerente)
 */
exports.fecharCaixa = asyncHandler(async (req, res) => {
    const { saldoFinalInformado } = req.body;

    // 1. Encontra o caixa que está com o status 'aberto'
    const caixa = await Caixa.findOne({ status: 'aberto' });
    if (!caixa) { res.status(404); throw new Error('Nenhum caixa aberto encontrado para fechar.'); }

    // 2. Busca todas as vendas realizadas desde a abertura do caixa
    const vendas = await Venda.find({
        createdAt: { $gte: caixa.dataAbertura }, // $gte = "maior ou igual a"
    });

    // 3. Calcula o total de vendas por método de pagamento
    let totalVendasDinheiro = 0;
    let totalVendasPix = 0;
    let totalVendasCartao = 0;

    vendas.forEach(venda => {
        venda.pagamentos.forEach(pagamento => {
            if (pagamento.metodo === 'dinheiro') totalVendasDinheiro += pagamento.valor;
            else if (pagamento.metodo === 'pix') totalVendasPix += pagamento.valor;
            else if (['cartao_credito', 'cartao_debito'].includes(pagamento.metodo)) totalVendasCartao += pagamento.valor;
        });
    });

    // 4. Calcula o saldo final que o sistema espera (Dinheiro)
    const saldoFinalCalculado = (caixa.saldoInicial + totalVendasDinheiro + (caixa.totalSuprimentos || 0)) - (caixa.totalSangrias || 0);
    const diferenca = parseFloat(saldoFinalInformado) - saldoFinalCalculado;

    // 5. Atualiza o registro do caixa com os dados de fechamento
    caixa.dataFechamento = Date.now();
    caixa.funcionarioFechamento = req.funcionario._id;
    caixa.vendaCartoes = totalVendasCartao;
    caixa.vendaPix = totalVendasPix;
    caixa.vendaDinheiro = totalVendasDinheiro;
    caixa.saldoFinalCalculado = saldoFinalCalculado;
    caixa.saldoFinalInformado = parseFloat(saldoFinalInformado);
    caixa.diferenca = diferenca;
    caixa.status = 'fechado';

    const caixaFechado = await caixa.save();

    res.status(200).json(caixaFechado);
});

