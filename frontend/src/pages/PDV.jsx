import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
    Search, ShoppingCart, Trash2, CreditCard, Banknote, QrCode,
    Percent, Tag, Calculator, Wallet, ArrowDownCircle, ArrowUpCircle, XCircle, Menu, X, Store,
    CheckCircle2, Lock, CheckCircle, Printer
} from 'lucide-react';
import { toast } from 'react-toastify';
import logoImg from '../assets/logo/Logo_DaBoa.png';
import Comprovante from '../components/Comprovante';

const PDV = () => {
    // --- ESTADOS DO CAIXA ---
    const [caixaAberto, setCaixaAberto] = useState(true);
    const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
    const [saldoInicial, setSaldoInicial] = useState('');
    const [loadingCaixa, setLoadingCaixa] = useState(false);

    // --- PRODUTOS E CARRINHO ---
    const [produtos, setProdutos] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [busca, setBusca] = useState('');
    const [carrinhoAberto, setCarrinhoAberto] = useState(false);

    // --- SANGRIA / SUPRIMENTO (Menu Dropdown) ---
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const dropdownRef = useRef(null);
    const [modalMovimentacao, setModalMovimentacao] = useState({ aberto: false, tipo: '' });
    const [valorMovimentacao, setValorMovimentacao] = useState('');
    const [motivoMovimentacao, setMotivoMovimentacao] = useState('');

    // --- PAGAMENTO ---
    const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
    const [metodoPagamento, setMetodoPagamento] = useState('dinheiro');
    const [valorRecebido, setValorRecebido] = useState('');
    const [tipoDesconto, setTipoDesconto] = useState('percentual');
    const [valorDescontoInput, setValorDescontoInput] = useState('');
    const [loading, setLoading] = useState(false);

    // RECIBO
    const [dadosRecibo, setDadosRecibo] = useState(null);
    const [modalSucessoVenda, setModalSucessoVenda] = useState(false);
    const componentRef = useRef();

    // FECHAMENTO DE CAIXA 
    const [modalFechamento, setModalFechamento] = useState({ aberto: false, etapa: 'input' });
    const [valorFechamento, setValorFechamento] = useState('');
    const [dadosFechamento, setDadosFechamento] = useState(null);

    useEffect(() => {
        verificarStatusCaixa();
        carregarProdutos();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownAberto(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- FUNÇÕES DE CAIXA ---
    const verificarStatusCaixa = async () => {
        try {
            const response = await api.get('/caixa/status');
            if (response.data.aberto) {
                setCaixaAberto(true);
                setModalAbrirCaixa(false);
            } else {
                setCaixaAberto(false);
                setModalAbrirCaixa(true);
            }
        } catch (error) {
            console.error("Erro ao verificar caixa:", error);
            setCaixaAberto(false);
        }
    }

    const realizarAberturaCaixa = async (e) => {
        e.preventDefault();
        if (!saldoInicial) return toast.warning('Informe o saldo inicial.');
        setLoadingCaixa(true);
        try {
            const valor = parseFloat(saldoInicial.replace(',', '.'));
            await api.post('/caixa/abrir', { saldoInicial: valor });
            toast.success('Caixa aberto com sucesso! 💸');
            setCaixaAberto(true);
            setModalAbrirCaixa(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao abrir caixa.');
        } finally {
            setLoadingCaixa(false);
        }
    }

    // --- FUNÇÕES DE PRODUTOS ---
    const carregarProdutos = async () => {
        try {
            const response = await api.get('/produtos?limit=100');
            setProdutos(response.data.produtos);
        } catch (error) {
            console.error('Erro ao carregar produtos');
        }
    };

    const adicionarAoCarrinho = (produto) => {
        const itemExistente = carrinho.find(item => item._id === produto._id);
        if (itemExistente) {
            setCarrinho(carrinho.map(item => item._id === produto._id ? { ...item, quantidade: item.quantidade + 1 } : item));
        } else {
            setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
        }
    };

    const removerDoCarrinho = (id) => {
        setCarrinho(carrinho.filter(item => item._id !== id));
    };

    // --- CÁLCULOS ---
    const calcularSubtotal = () => carrinho.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);

    const calcularValorDesconto = () => {
        const subtotal = calcularSubtotal();
        const valorInput = parseFloat(valorDescontoInput.replace(',', '.')) || 0;
        return tipoDesconto === 'percentual' ? (subtotal * valorInput) / 100 : valorInput;
    };

    const calcularTotalFinal = () => {
        const total = calcularSubtotal() - calcularValorDesconto();
        return total > 0 ? total : 0;
    };

    // --- MOVIMENTAÇÕES (Sangria/Suprimento) ---
    const abrirMovimentacao = (tipo) => {
        setDropdownAberto(false);
        setValorMovimentacao('');
        setMotivoMovimentacao('');
        setModalMovimentacao({ aberto: true, tipo });
    };

    const fecharModais = () => {
        setModalMovimentacao({ aberto: false, tipo: '' });
        setDropdownAberto(false);
        setValorMovimentacao('');
        setMotivoMovimentacao('');
    }

    const realizarMovimentacao = async (e) => {
        e.preventDefault();
        try {
            const rota = modalMovimentacao.tipo === 'sangria' ? '/caixa/sangria' : '/caixa/suprimento';
            await api.post(rota, {
                valor: parseFloat(valorMovimentacao.replace(',', '.')),
                motivo: motivoMovimentacao
            });
            toast.success(`${modalMovimentacao.tipo === 'sangria' ? 'Sangria' : 'Suprimento'} realizada!`);
            fecharModais();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro na operação');
        }
    };

    // --- FINALIZAR VENDA ---
    const realizarVenda = async () => {
        if (carrinho.length === 0) return toast.warning('Carrinho vazio!');
        if (!caixaAberto) {
            setModalAbrirCaixa(true);
            return toast.error('O caixa precisa estar aberto para vender');
        }

        const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || '{}');
        const totalFinalBruto = calcularTotalFinal();
        const totalFinalArredondado = parseFloat(totalFinalBruto.toFixed(2));

        if (metodoPagamento === 'dinheiro') {
            const entregue = parseFloat(valorRecebido.replace(',', '.')) || 0;
            if (entregue < totalFinalArredondado) {
                return toast.warning(`Valor insuficiente. Faltam R$ ${(totalFinalArredondado - entregue).toFixed(2)}`);
            }
        }

        setLoading(true);

        try {
            let objetoDesconto = undefined;
            const valorDescInputNumber = parseFloat(valorDescontoInput.replace(',', '.'));

            if (!isNaN(valorDescInputNumber) && valorDescInputNumber > 0) {
                objetoDesconto = { tipo: tipoDesconto, valor: valorDescInputNumber };
            }

            const payload = {
                vendedor: usuarioLogado._id,
                itens: carrinho.map(item => ({
                    produtoId: item._id,
                    quantidade: parseInt(item.quantidade)
                })),
                pagamentos: [{ metodo: metodoPagamento, valor: totalFinalArredondado }]
            };

            if (objetoDesconto) payload.desconto = objetoDesconto;

            // 1. Envia a venda
            const response = await api.post('/vendas', payload);
            const vendaRealizada = response.data;

            toast.success('Venda realizada! 🎉');

            // 2. Prepara os dados para o Recibo
            // CORREÇÃO AQUI: 'precoUnitaro' -> 'precoUnitario'
            const dadosParaImpressao = {
                codigo: vendaRealizada._id || Date.now(),
                data: new Date(),
                vendedor: usuarioLogado,
                itens: carrinho.map(item => ({
                    produtoNome: item.nome,
                    quantidade: item.quantidade,
                    precoUnitario: item.precoVenda // <--- CORRIGIDO AQUI (estava precoUnitaro)
                })),
                total: totalFinalArredondado,
                desconto: descontoCalculado,
                pagamentos: [{ metodo: metodoPagamento, valor: totalFinalArredondado }],
                troco: metodoPagamento === 'dinheiro' ? ((parseFloat(valorRecebido.replace(',', '.') || 0) - totalFinalArredondado)) : 0
            }

            setDadosRecibo(dadosParaImpressao);
            setModalSucessoVenda(true);

            // 3. Limpa o carrinho e fecha modal de pagamento
            setCarrinho([]);
            setModalPagamentoAberto(false);
            setValorRecebido('');
            setValorDescontoInput('');
            setTipoDesconto('percentual');
            carregarProdutos();

        } catch (error) {
            console.error("ERRO VENDA:", error);
            let msg = "Erro ao processar venda.";
            if (error.response?.data?.errors?.[0]?.msg) msg = error.response.data.errors[0].msg;
            else if (error.response?.data?.message) msg = error.response.data.message;
            toast.error(`Falha: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const subtotal = calcularSubtotal();
    const descontoCalculado = calcularValorDesconto();
    const totalFinal = calcularTotalFinal();
    const qtdItensCarrinho = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

    const handleImprimirRecibo = () => {
        window.print();
    }

    const realizarFechamentoCaixa = async (e) => {
        e.preventDefault();
        if (!valorFechamento) return toast.warning('Informe o valor total em dinheiro a gaveta.');
        setLoading(true);
        try {
            const valorInformado = parseFloat(valorFechamento.replace(',', '.'));
            const response = await api.post('/caixa/fechar', { saldoFinalInformado: valorInformado });

            setDadosFechamento(response.data);
            setModalFechamento({ aberto: true, etapa: 'resumo' });

            setCaixaAberto(false);
            setDropdownAberto(false);
            toast.success('Caixa fechado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Erro ao fechar o caixa.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#fffdf5] relative">

            {/* --- CABEÇALHO --- */}
            <header className="px-4 py-3 bg-white border-b border-amber-100 flex items-center justify-between gap-4 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="DaBoa" className="h-10 w-auto object-contain drop-shadow-sm" />
                </div>

                <div className="flex-1 max-w-xl relative">
                    <Search className="absolute left-3 top-2.5 text-amber-700/50" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        className="w-full pl-10 pr-4 py-2 bg-amber-50/50 border border-amber-200/60 rounded-full focus:ring-2 focus:ring-green-500/30 focus:border-green-600 outline-none text-stone-700 placeholder-stone-400 transition"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        disabled={!caixaAberto}
                    />
                </div>

                <button
                    onClick={() => setCarrinhoAberto(true)}
                    className="relative p-2 bg-green-900 text-amber-400 rounded-xl hover:bg-green-800 transition shadow-lg shadow-green-900/20 flex"
                >
                    <ShoppingCart size={24} />
                    {qtdItensCarrinho > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#fffdf5]">
                            {qtdItensCarrinho}
                        </span>
                    )}
                </button>
            </header>

            {/* --- PRODUTOS --- */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                    {produtos
                        .filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))
                        .map(produto => (
                            <div
                                key={produto._id}
                                onClick={() => caixaAberto && adicionarAoCarrinho(produto)}
                                className={`
                                    bg-white rounded-xl border border-amber-100 p-3 flex flex-col gap-2 relative group transition-all duration-200
                                    ${!caixaAberto ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:shadow-lg hover:border-amber-300 cursor-pointer'}
                                `}
                            >
                                <div className="aspect-square bg-stone-50 rounded-lg overflow-hidden flex items-center justify-center relative">
                                    {produto.imagemUrl ? (
                                        <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="text-amber-200" size={40} />
                                    )}
                                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-sm ${produto.quantidadeEstoque > 5 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        {produto.quantidadeEstoque} un
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-stone-700 leading-tight line-clamp-2 min-h-[2.5em]">{produto.nome}</h3>
                                    <p className="text-lg font-bold text-green-700 mt-1">R$ {produto.precoVenda.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <div className="absolute inset-0 bg-green-900/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity pointer-events-none" />
                            </div>
                        ))}
                </div>
            </div>

            {/* --- GAVETA DO CARRINHO --- */}
            {carrinhoAberto && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:bg-transparent lg:backdrop-blur-none lg:pointer-events-none"
                    onClick={() => setCarrinhoAberto(false)}
                />
            )}

            <div className={`
                fixed top-0 right-0 h-full bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-amber-100
                w-[85%] sm:w-[400px] lg:w-[350px]
                ${carrinhoAberto ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-4 bg-green-900 text-amber-50 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownAberto(!dropdownAberto)}
                                className="p-2 hover:bg-green-800 rounded-lg transition text-amber-400"
                                title="Opções do Caixa"
                            >
                                <Menu size={24} />
                            </button>
                            {dropdownAberto && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-amber-100 overflow-hidden animate-fade-in z-50">
                                    <div className="p-3 border-b border-stone-100 bg-[#fffdf5]">
                                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Funções do Caixa</span>
                                    </div>
                                    <button onClick={() => abrirMovimentacao('suprimento')} className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-700 font-medium flex items-center gap-2 border-b border-stone-50">
                                        <ArrowUpCircle size={18} /> Suprimento
                                    </button>
                                    <button onClick={() => abrirMovimentacao('sangria')} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-700 font-medium flex items-center gap-2 border-b border-stone-50">
                                        <ArrowDownCircle size={18} /> Sangria
                                    </button>
                                    <button onClick={() => {
                                        setDropdownAberto(false);
                                        setValorFechamento('');
                                        setModalFechamento({ aberto: true, etapa: 'input' });
                                    }} className="w-full text-left px-4 py-3 hover:bg-stone-100 text-stone-600 font-medium flex items-center gap-2">
                                        <XCircle size={18} /> Fechar Caixa
                                    </button>
                                </div>
                            )}
                        </div>
                        <span className="font-bold text-lg">Carrinho</span>
                    </div>
                    <button onClick={() => setCarrinhoAberto(false)} className="p-1 hover:bg-green-800 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fffdf5]">
                    {carrinho.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-2">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p>Seu carrinho está vazio</p>
                        </div>
                    ) : (
                        carrinho.map(item => (
                            <div key={item._id} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-stone-700 text-sm truncate" title={item.nome}>{item.nome}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">{item.quantidade} x R$ {item.precoVenda.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="font-bold text-green-700 text-sm">R$ {(item.quantidade * item.precoVenda).toFixed(2)}</span>
                                    <button onClick={() => removerDoCarrinho(item._id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 bg-white border-t border-amber-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-stone-500 font-medium">Total</span>
                        <span className="text-3xl font-bold text-green-700">R$ {totalFinal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                        onClick={() => setModalPagamentoAberto(true)}
                        disabled={carrinho.length === 0}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3.5 rounded-xl hover:from-green-700 hover:to-green-800 transition shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Finalizar Venda
                    </button>
                </div>
            </div>

            {/* --- MODAIS --- */}
            {/* 1. Abrir Caixa */}
            {modalAbrirCaixa && (
                <div className='fixed inset-0 bg-green-900/90 flex items-center justify-center z-[39] backdrop-blur-sm p-4'>
                    <div className='bg-[#fffdf5] rounded-2xl w-full max-w-md shadow-2xl p-8 text-center border-4 border-amber-500/30 animate-bounce-in'>
                        <div className='bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-200'>
                            <Wallet size={40} className='text-amber-600' />
                        </div>
                        <h2 className='text-2xl font-bold text-green-900 mb-2'>Caixa Fechado</h2>
                        <p className='text-stone-500 mb-6'>Informe o fundo de troco para iniciar.</p>

                        <form onSubmit={realizarAberturaCaixa}>
                            <div className='relative mb-6'>
                                <span className='absolute left-4 top-3.5 text-green-700 font-bold'>R$</span>
                                <input
                                    type='number' step='0.01' required
                                    className='w-full pl-12 pr-4 py-3 bg-white border-2 border-stone-200 rounded-xl text-2xl font-bold text-green-800 focus:border-amber-500 outline-none transition'
                                    placeholder='0,00'
                                    value={saldoInicial}
                                    onChange={e => setSaldoInicial(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button type='submit' disabled={loadingCaixa} className='w-full bg-green-700 text-white font-bold py-4 rounded-xl hover:bg-green-800 transition shadow-lg'>
                                {loadingCaixa ? 'Abrindo...' : 'INICIAR AS VENDAS'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Pagamento */}
            {modalPagamentoAberto && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">Finalizar Venda</h2>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-600 mb-1 block">Desconto</label>
                                        <div className="flex">
                                            <input type="number" className="w-full p-2 border border-r-0 border-slate-300 rounded-l outline-none focus:border-blue-500" placeholder="0" value={valorDescontoInput} onChange={e => setValorDescontoInput(e.target.value)} />
                                            <div className="flex border border-l-0 border-slate-300 rounded-r bg-white">
                                                <button onClick={() => setTipoDesconto('percentual')} className={`px-3 ${tipoDesconto === 'percentual' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}><Percent size={16} /></button>
                                                <button onClick={() => setTipoDesconto('fixo')} className={`px-3 border-l ${tipoDesconto === 'fixo' ? 'bg-blue-100 text-blue-600' : 'text-slate-400'}`}><Tag size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right pb-2">
                                        <span className="text-xs text-slate-400 block">Desconto</span>
                                        <span className="text-red-500 font-bold text-lg">- R$ {descontoCalculado.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-slate-700">Total Final</span>
                                    <span className="text-3xl font-bold text-green-600">R$ {totalFinal.toFixed(2)}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Método de Pagamento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['dinheiro', 'pix', 'cartao_debito', 'cartao_credito'].map((metodo) => (
                                        <button key={metodo} onClick={() => setMetodoPagamento(metodo)} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition ${metodoPagamento === metodo ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                            {metodo === 'dinheiro' && <Banknote />}
                                            {metodo === 'pix' && <QrCode />}
                                            {metodo.includes('cartao') && <CreditCard />}
                                            <span className="capitalize text-sm font-medium">{metodo.replace('_', ' ')}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {metodoPagamento === 'dinheiro' && (
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                    <label className="block text-sm font-bold text-amber-800 mb-1">Valor Recebido (R$)</label>
                                    <div className="flex gap-4 items-center">
                                        <input type="number" className="flex-1 p-3 border border-amber-300 rounded-lg text-lg outline-none focus:ring-2 focus:ring-amber-500" placeholder="R$ 0,00" value={valorRecebido} onChange={e => setValorRecebido(e.target.value)} autoFocus />
                                        <div className="text-right">
                                            <span className="text-xs text-amber-600 font-bold uppercase">Troco</span>
                                            <div className="text-xl font-bold text-slate-800">
                                                R$ {((parseFloat(valorRecebido.replace(',', '.') || 0) - totalFinal) > 0 ? (parseFloat(valorRecebido.replace(',', '.') || 0) - totalFinal) : 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                            <button onClick={() => setModalPagamentoAberto(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition">Cancelar</button>
                            <button onClick={realizarVenda} disabled={loading} className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 transition shadow-lg shadow-green-600/20">
                                {loading ? 'Processando...' : `Confirmar R$ ${totalFinal.toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Sangria/Suprimento */}
            {modalMovimentacao.aberto && (
                <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm'>
                    <div className='bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl'>
                        <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${modalMovimentacao.tipo === 'sangria' ? 'text-red-600' : 'text-green-600'}`}>
                            {modalMovimentacao.tipo === 'sangria' ? <ArrowDownCircle /> : <ArrowUpCircle />}
                            {modalMovimentacao.tipo === 'sangria' ? 'Realizar Sangria' : 'Realizar Suprimento'}
                        </h3>
                        <form onSubmit={realizarMovimentacao}>
                            <div className='mb-4'>
                                <label className='block text-sm font-bold text-stone-600 mb-1'>Valor (R$)</label>
                                <input type='number' step='0.01' required className='input-padrao text-lg font-bold' placeholder='0,00' value={valorMovimentacao} onChange={e => setValorMovimentacao(e.target.value)} autoFocus />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-stone-600 mb-1">Motivo / Descrição</label>
                                <input type="text" required className="input-padrao" placeholder={modalMovimentacao.tipo === 'sangria' ? "Ex: Pagamento Motoboy" : "Ex: Troco inicial extra"} value={motivoMovimentacao} onChange={e => setMotivoMovimentacao(e.target.value)} />
                            </div>
                            <div className='flex gap-2'>
                                <button type='button' onClick={fecharModais} className='flex-1 py-2 text-stone-500 font-bold bg-stone-100 rounded'>Cancelar</button>
                                <button type="submit" className={`flex-1 py-2 text-white font-bold rounded ${modalMovimentacao.tipo === 'sangria' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/** Modal Fechar Caixa */}
            {modalFechamento.aberto && (
                <div className='fixed inset-0 bg-stone-900/90 flex items-center justify-center z-[80] p-4 backdrop-blur-md'>

                    {/* Etapa 1: input cego*/}
                    {modalFechamento.etapa === 'input' && (
                        <div className='bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up'>
                            <div className='bg-stone-800 p-6 text-white text-center'>
                                <Lock size={40} className='mx-auto mb-3 text-amber-400' />
                                <h2 className='text-2xl font-bold'>Conferência de Fechamento</h2>
                                <p className='text-stone-300 text-sm mt-1'>Conte o dinheiro físico na gaveta abaixo.</p>
                            </div>

                            <div className='p-8'>
                                <form onSubmit={realizarFechamentoCaixa}>
                                    <label className='block text-sm font-bold text-stone-600 mb-2 uppercase tracking-wide'>Valor em dinheiro</label>
                                    <div className='relative mb-6'>
                                        <span className='absolute left-4 top-4 text-stone-400 font-bold text-xl'>R$</span>
                                        <input
                                            type='number' step='0.01' required
                                            className='w-full pl-12 pr-4 py-4 bg-stone-50 border-2 border-stone-200 rounded-xl text-3xl font-bold text-stone-800 focus:border-amber-500 outline-none transition'
                                            placeholder='0,00'
                                            value={valorFechamento}
                                            onChange={e => setValorFechamento(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className='flex gap-3'>
                                        <button
                                            type='button'
                                            onClick={() => setModalFechamento({ aberto: false, etapa: 'input' })}
                                            className='flex-1 py-4 text-stone-500 font-bold hover:bg-stone-100 rounded-xl transition'
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type='submit'
                                            disabled={loading}
                                            className='flex-[2] bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-900/20'
                                        >
                                            {loading ? 'Calculando...' : 'Finalizar caixa'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/** Resumo final */}
                    {modalFechamento.etapa === 'resumo' && dadosFechamento && (
                        <div className='bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-bounce-in border-t-8 border-stone-800'>
                            <div className='p-8 text-center'>
                                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                    <CheckCircle2 size={40} className='text-green-600' />
                                </div>
                                <h2 className='text-2xl font-bold text-stone-800 mb-1'>Caixa Fechado!</h2>
                                <p className='text-stone-500 text-sm'>Resumo da Conferência</p>
                            </div>

                            {/** Cupom de conferência */}
                            <div className='bg-stone-50 px-8 py-6 border-y border-stone-100 space-y-3'>
                                <div className='flex justify-between items-center text-sm'>
                                    <span className='text-stone-500'>Esperado pelo sistema</span>
                                    {/** Optional Chaining (?.) para evitar erro se o dado não vier */}
                                    <span className='font-bold text-stone-700'>
                                        {dadosFechamento.saldoFinalCalculado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>

                                <div className='h-px bg-stone-200 my-2'></div>

                                <div className='flex justify-between items-center'>
                                    <span className='font-bold text-sky-800'>Diferença</span>
                                    <span className={`font-bold text-lg px-2 py-1 rounded ${dadosFechamento.diferenca === 0
                                        ? 'bg-blue-100 text-blue-700' // Sobrou dinheiro
                                        : 'bg-red-100 text-red-700' // Faltou dinheiro
                                        }`}>
                                        {dadosFechamento.diferenca?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </span>
                                </div>

                                <p className='text-xs text-center mt-4 font-medium'>
                                    {dadosFechamento.diferenca === 0
                                        ? 'Perfeito! O caixa bateu exatamente.'
                                        : dadosFechamento.diferenca > 0
                                            ? 'Atenção: Sobrou dinheiro na gaveta.'
                                            : 'Atenção: Faltou dinheiro na gaveta.'
                                    }
                                </p>
                            </div>
                            <div className='p-6'>
                                <button
                                    onClick={() => {
                                        setModalFechamento({ aberto: false, etapa: 'input' });
                                        window.location.reload() // recarrega para forçar o novo login
                                    }}
                                    className='w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-stone-900 transition'
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/** Componente oculto de impressão */}
            <Comprovante ref={componentRef} dados={dadosRecibo} />

            {/* SUCESSO DA VENDA */}
            {modalSucessoVenda && (
                <div className="fixed inset-0 bg-green-900/90 flex items-center justify-center z-[90] backdrop-blur-md p-4">
                    <div className="bg-[#fffdf5] rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center border-4 border-amber-400/50 animate-bounce-in">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>

                        <h2 className="text-3xl font-bold text-green-900 mb-2">Venda Concluída!</h2>
                        <p className="text-stone-500 mb-8 font-medium">O que deseja fazer agora?</p>

                        <div className="space-y-3">
                            <button
                                onClick={handleImprimirRecibo}
                                className="w-full bg-stone-800 text-white font-bold py-4 rounded-xl hover:bg-stone-900 transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <Printer size={20} /> IMPRIMIR RECIBO
                            </button>

                            <button
                                onClick={() => setModalSucessoVenda(false)}
                                className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition shadow-lg flex items-center justify-center gap-2"
                            >
                                Nova Venda
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default PDV;