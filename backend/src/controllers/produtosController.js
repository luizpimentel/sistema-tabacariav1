// controllers/produtosController.js
const Produto = require('../models/Produto');
const HistoricoPreco = require('../models/HistoricoPreco')
const asyncHandler = require('express-async-handler');

/**
 * @desc    Criar um novo produto
 * @route   POST /api/produtos
 * @access  Privado (Gerente, Supervisor)
 */
exports.criarProduto = asyncHandler(async (req, res) => {
    const { nome, precoVenda, precoCusto, quantidadeEstoque, categoria, estoqueMinimo, descricao } = req.body;

    // Verificamos se o arquivo foi enviado
    let imagemUrl = '';
    if (req.file) {
        imagemUrl = req.file.path; // O Cloudinary devolve o link direto aqui no .path
    }

    const novoProduto = await Produto.create({
        nome,
        precoCusto,
        precoVenda,
        categoria,
        quantidadeEstoque,
        estoqueMinimo,
        descricao,
        imagemUrl: imagemUrl || undefined, // Se tiver imagem usa ela, se não usa o padrão do Model
    });

    res.status(201).json(novoProduto);
});

/**
 * @desc    Listar todos os produtos com busca e paginação
 * @route   GET /api/produtos?search=termo&page=1&limit=10
 * @access  Privado (Qualquer funcionário logado)
 */
exports.listarTodosProdutos = asyncHandler(async (req, res) => {
    // 1. Capturar parâmetros da query
    const pagina = parseInt(req.query.page) || 1;
    const limite = parseInt(req.query.limit) || 10;
    const termoBusca = req.query.search || '';

    // 2. Construir o filtro de busca
    // $regex para busca parcial (como 'LIKE' do SQL), $options: 'i' para case-insensitive
    const filtro = termoBusca
        ? { nome: { $regex: termoBusca, $options: 'i' } }
        : {};

    // 3. Executar consultas (busca e contagem) em paralelo
    const [produtos, totalProdutos] = await Promise.all([
        Produto.find(filtro)
            .limit(limite)
            .skip((pagina - 1) * limite)
            .sort({ nome: 'asc' }),
        Produto.countDocuments(filtro)
    ]);

    // 4. Enviar resposta com metadados de paginação
    res.status(200).json({
        produtos,
        paginaAtual: pagina,
        totalPaginas: Math.ceil(totalProdutos / limite),
        totalProdutos,
    });
});

/**
 * @desc    Buscar um produto por ID
 * @route   GET /api/produtos/:id
 * @access  Privado (Qualquer funcionário logado)
 */
exports.buscarProdutoPorId = asyncHandler(async (req, res) => {
    const produto = await Produto.findById(req.params.id);
    if (!produto) { res.status(404); throw new Error('Produto não encontrado'); }
    res.status(200).json(produto);
});

/**
 * @desc    Atualizar um produto
 * @route   PUT /api/produtos/:id
 * @access  Privado (Gerente, Supervisor)
 */
exports.atualizarProduto = asyncHandler(async (req, res) => {
    // Busca o produto atual no banco antes de atualizar
    const produtoAtual = await Produto.findById(req.params.id);

    if (!produtoAtual) {
        res.status(404);
        throw new Error('Produto não encontrado');
    }

    // Preparamos o objeto de atualização
    const dadosAtualizados = { ...req.body };

    if (req.file) {
        dadosAtualizados.imagemUrl = req.file.path;
    }

    // verifica se o precoCusto foi enviado e se é diferente do atual
    if (req.body.precoCusto) {
        const novoCusto = parseFloat(req.body.precoCusto);
        const custoAntigo = produtoAtual.precoCusto;

        // se mudou
        if (novoCusto !== custoAntigo) {

            //Verificação de Segurança
            if (req.funcionario.cargo !== 'gerente') {
                res.status(403);
                throw new Error('Acesso negado: Apenas gerentes podem alterar o preço de custo.');
            }

            // Grava no histórico antes de atualizar
            await HistoricoPreco.create({
                produto: produtoAtual._id,
                precoCustoAntigo: custoAntigo,
                precoCustoNovo: novoCusto,
                responsavel: req.funcionario._id,
                motivo: "Alteração via sistema"
            });

            console.log(`Log: Preço de custo alterado por ${req.funcionario.nome}`);
        }
    }

    // Aplicando a atualização no banco
    const produtoAtualizado = await Produto.findByIdAndUpdate(
        req.params.id,
        dadosAtualizados,
        { new: true, runValidators: true }
    );

    res.status(200).json(produtoAtualizado);
});

/**
 * @desc    Deletar um produto
 * @route   DELETE /api/produtos/:id
 * @access  Privado (Gerente)
 */
exports.deletarProduto = asyncHandler(async (req, res) => {
    const produtoDeletado = await Produto.findByIdAndDelete(req.params.id);

    if (!produtoDeletado) {
        res.status(404);
        throw new Error('Produto não encontrado para deletar');
    }

    res.status(200).json({ message: 'Produto deletado com sucesso', id: req.params.id });
});

/**
 * @desc    Listar produtos com estoque baixo (menor ou igual ao estoque mínimo)
 * @route   GET /api/produtos/alerta-estoque
 * @access  Privado (Gerente, Supervisor)
 */
exports.listarProdutosComEstoqueBaixo = asyncHandler(async (req, res) => {
    const produtos = await Produto.find({
        // $expr permite usar expressões de agregação (como comparar dois campos)
        $expr: {
            $lte: ['$quantidadeEstoque', '$estoqueMinimo']
        }
    });

    res.status(200).json(produtos);
});