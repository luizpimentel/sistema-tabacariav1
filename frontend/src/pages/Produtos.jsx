import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, X, Image as ImageIcon, Search, Calculator } from 'lucide-react';

const Produtos = () => {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [modalAberto, setModalAberto] = useState(false);
    const [editando, setEditando] = useState(null);
    const fileInputRef = useRef(null);

    // Recupera o usuário para verificar permissões
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    // Estados para calculadora de custo
    const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
    const [calcTotal, setCalcTotal] = useState('');
    const [calcQtd, setCalcQtd] = useState('');

    //Estados Formulário
    const [formData, setFormData] = useState({
        nome: '',
        categoria: '',
        precoCusto: '',
        precoVenda: '',
        quantidadeEstoque: '',
        estoqueMinimo: '5',
        imagem: null //arquivo real
    });

    const [previewImagem, setPreviewImagem] = useState(null); //URL para mostar na tela

    useEffect(() => {
        carregarProdutos();
    }, []);

    const carregarProdutos = async () => {
        try {
            const response = await api.get('/produtos?limit=50');
            setProdutos(response.data.produtos);
        } catch (error) {
            toast.error('Erro ao listar produtos');
        } finally {
            setLoading(false);
        }
    };

    // Filtragem
    const produtosFiltrados = produtos.filter(prod => prod.nome.toLowerCase().includes(busca.toLocaleLowerCase()) || (prod.categoria && prod.categoria.toLocaleLowerCase().includes(busca.toLowerCase())))

    const abrirModal = (produto = null) => {
        setMostrarCalculadora(false);
        if (produto) {
            setEditando(produto);
            setFormData({
                nome: produto.nome,
                categoria: produto.categoria || '',
                precoCusto: produto.precoCusto,
                precoVenda: produto.precoVenda,
                quantidadeEstoque: produto.quantidadeEstoque,
                estoqueMinimo: produto.estoqueMinimo,
                imagem: null
            });
            setPreviewImagem(produto.imagemUrl);
        } else {
            setEditando(null);
            setFormData({
                nome: '', categoria: '', precoCusto: '', precoVenda: '', quantidadeEstoque: '', estoqueMinimo: '5', imagem: null
            });
            setPreviewImagem(null);
        }
        setModalAberto(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, imagem: file });
            setPreviewImagem(URL.createObjectURL(file)); //Cria uma URL temporária
        }
    };

    const aplicarCalculoCusto = () => {
        const total = parseFloat(calcTotal);
        const qtd = parseFloat(calcQtd);

        if (!total || !qtd || qtd === 0) {
            total.warning('Insira valores válidos para calcular.');
            return;
        }

        const unitario = total / qtd;

        // Atualiza o formulário com o valor calculado

        setFormData({ ...formData, precoCusto: unitario.toFixed(2) });

        // Reset
        setCalcTotal('');
        setCalcQtd('');
        setMostrarCalculadora(false);
        toast.success(`Custo unitário calculado: R$ ${unitario.toFixed(2)}`);
    }

    const handleSubmit = async (e) => {

        e.preventDefault();

        // Prepara FormData (obrigatório para envio de arquivos no backend)
        const data = new FormData();
        data.append('nome', formData.nome);
        data.append('categoria', formData.categoria);
        data.append('precoCusto', formData.precoCusto);
        data.append('precoVenda', formData.precoVenda);
        data.append('quantidadeEstoque', formData.quantidadeEstoque);
        data.append('estoqueMinimo', formData.estoqueMinimo);
        if (formData.imagem) {
            data.append('imagem', formData.imagem);
        }

        try {
            if (editando) {
                await api.put('/produtos', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Produto atualzado! :)');
            } else {
                await api.post('/produtos', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Produto criado! :)');
            }
            setModalAberto(false);
            carregarProdutos();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Erro ao salvar o produto. :( ');
        }
    };

    const deletarProduto = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esse produto?')) {
            try {
                await api.delete(`/produtos/${id}`);
                toast.success('Produto excluído');
                carregarProdutos();
            } catch (error) {
                toast.error('Erro ao excluir');
            }
        }
    };
    return (
        <div className='p-6 min-h-screen bg-slate-100'>
            <div className='max-w-7xl mx-auto'>
                {/** Cabeçalho */}
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-2xl font-bold text-slate-800'>Gestão de Produtos</h1>

                    <div className='flex gap-3 w-full md:w-auto'>
                        {/** Campo de busca */}
                        <div className='relative flex-1 md:w-64'>
                            <Search className='absolute left-3 top-2.5 text-slate-400' size={20} />
                            <input
                                type='text'
                                placeholder='Buscar produto...'
                                className='w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none'
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => abrirModal()}
                        className='bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition'>
                        <Plus size={20} /> Novo Produto
                    </button>
                </div>

                {/** Lista */}
                <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
                    <table className='w-full text-left border-collapse'>
                        <thead className='bg-slate-50 border-b border-slate-200'>
                            <tr>
                                <th className='p-4 text-slate-500 font-medium'>Produto</th>
                                <th className='p-4 text-slate-500 font-medium'>Categoria</th>
                                <th className='p-4 text-slate-500 font-medium'>Custo</th>
                                <th className='p-4 text-slate-500 font-medium'>Venda</th>
                                <th className='p-4 text-slate-500 font-medium'>Estoque</th>
                                <th className='p-4 text-slate-500 font-medium text-right'>Ações</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {produtosFiltrados.map(prod => (
                                <tr key={prod._id} className='hover:bg-slate-50 transition'>
                                    <td className='p-4 flex items-center gap-3'>
                                        <img
                                            src={prod.imagemUrl}
                                            className='w-10 h-10 rounded object-cover bg-slate-200'
                                            alt=''
                                        />
                                        <span className='font-medium text-slate-700'>{prod.nome}</span>
                                    </td>
                                    <td className='p-4 text-slate-500'>{prod.categoria || '-'}</td>
                                    <td className='p-4 text-slate-500'>R$ {(prod.precoCusto || 0).toFixed(2)}</td>
                                    <td className='p-4 text-slate-600 font-bold'>R$ {(prod.precoVenda || 0).toFixed(2)}</td>
                                    <td className='p-4'>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${prod.quantidadeEstoque <= prod.estoqueMinimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {prod.quantidadeEstoque} un
                                        </span>
                                    </td>
                                    <td className='p-4 text-right'>
                                        <button onClick={() => abrirModal(prod)} className='text-blue-500 hover:text-blue-700 mr-3'>
                                            <Edit size={18} />
                                        </button>
                                        {usuario.cargo === 'gerente' && (
                                            <button onClick={() => deletarProduto(prod._id)} className="text-red-400 hover:text-red-600" title="Excluir">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {produtosFiltrados.length === 0 && (
                        <div className='p-8 text-center text-slate-400'>
                            {busca ? 'Nenhum produto encontrado para sua busca.' : 'Nenhum produto cadastrado.'}
                        </div>
                    )}
                </div>
            </div>

            {/** Modal de cadastro/edição */}
            {modalAberto && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm p-4'>
                    <div className='bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <div className='p-6 border-b flex justify-between items-center stick top-0 bg-white z-10'>
                            <h2 className='text-xl font-bold text-slate-800'>
                                {editando ? 'Editar Prduto' : 'Novo Produto'}
                            </h2>
                            <button onClick={() => setModalAberto(false)} className='text-slate-400 hover:text-slate-600'>
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="flex justify-center mb-6">
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-32 h-32 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition overflow-hidden relative"
                                >
                                    {previewImagem ? (
                                        <img src={previewImagem} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon className="text-slate-400 mb-2" />
                                            <span className="text-xs text-slate-500">Foto</span>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="label">Nome</label>
                                    <input required className="input-padrao" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Categoria</label>
                                    <input className="input-padrao" value={formData.categoria} onChange={e => setFormData({ ...formData, categoria: e.target.value })} />
                                </div>

                                {/* --- CAMPO PREÇO DE CUSTO COM CALCULADORA --- */}
                                <div className="relative">
                                    <label className="label flex justify-between">
                                        Custo Unitário (R$)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            className="input-padrao"
                                            value={formData.precoCusto}
                                            onChange={e => setFormData({ ...formData, precoCusto: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
                                            className="bg-slate-200 text-slate-600 px-3 rounded hover:bg-slate-300 transition"
                                            title="Calculadora de Custo"
                                        >
                                            <Calculator size={20} />
                                        </button>
                                    </div>

                                    {/* POPUP DA CALCULADORA */}
                                    {mostrarCalculadora && (
                                        <div className="absolute top-full right-0 mt-2 bg-white p-4 rounded-lg shadow-xl border border-slate-200 z-20 w-64 animate-fade-in">
                                            <h4 className="font-bold text-slate-700 mb-3 text-sm">Calcular Custo Unitário</h4>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Total da Nota/Pacote (R$)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-2 border rounded text-sm"
                                                        placeholder="Ex: 200,00"
                                                        value={calcTotal}
                                                        onChange={e => setCalcTotal(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 block mb-1">Quantidade de Itens</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-2 border rounded text-sm"
                                                        placeholder="Ex: 50"
                                                        value={calcQtd}
                                                        onChange={e => setCalcQtd(e.target.value)}
                                                    />
                                                </div>

                                                <div className="pt-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMostrarCalculadora(false)}
                                                        className="flex-1 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={aplicarCalculoCusto}
                                                        className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700"
                                                    >
                                                        Aplicar
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Setinha do balão */}
                                            <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-t border-l border-slate-200 transform rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                                {/* ------------------------------------------- */}

                                <div>
                                    <label className="label">Venda Unitária (R$)</label>
                                    <input type="number" step="0.01" required className="input-padrao border-blue-300 bg-blue-50" value={formData.precoVenda} onChange={e => setFormData({ ...formData, precoVenda: e.target.value })} />
                                </div>

                                <div>
                                    <label className="label">Estoque Atual</label>
                                    <input type="number" required className="input-padrao" value={formData.quantidadeEstoque} onChange={e => setFormData({ ...formData, quantidadeEstoque: e.target.value })} />
                                </div>

                                <div>
                                    <label className="label">Estoque Mínimo (Alerta)</label>
                                    <input type="number" className="input-padrao" value={formData.estoqueMinimo} onChange={e => setFormData({ ...formData, estoqueMinimo: e.target.value })} />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setModalAberto(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Produtos;