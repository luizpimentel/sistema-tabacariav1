import { useEffect, useState } from 'react';
import api from '../services/api';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    LogOut,
    DollarSign,
    ShoppingBag,
    AlertTriangle,
    TrendingUp,
    Store,
    BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Recupera o nome do usuário salvo no login

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    // Dados fictícios para o gráfico (enquanto não criamos a rota de histórico no backend)
    const dadosGrafico = [
        { nome: '08:00', vendas: 120 },
        { nome: '10:00', vendas: 250 },
        { nome: '12:00', vendas: 400 },
        { nome: '14:00', vendas: 180 },
        { nome: '16:00', vendas: 320 },
        { nome: '18:00', vendas: 500 },
    ];

    useEffect(() => {
        carregarDados();

        // --- conexão com socket.io (para alertas)  ---
        //conecta ao backend para ouvir os eventos
        const socket = io('http://localhost:5000');

        // Ouve o envento nova_venda
        socket.on('nova_venda', (novaVenda) => {
            // Toca um alerta sonoro
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
            audio.play().catch(e => console.log("Reprodução de áudio bloqueada"));

            // Mostra a notificicação na tela

            toast.success(
                <div>
                    <p className='font-bold'>💰 {novaVenda.mensagem}</p>
                    <p className='text-sm'>Vendedor: {novaVenda.vendedor}</p>
                </div>,
                { autoClose: 10000 } // 10 segundos na tela
            );

            // Atualiza os números da tela automaticamente
            carregarDados();
        });

        // Desconecta quando sair da tela para não duplicar avisos

        return () => socket.disconnect();
    }, []);

    const carregarDados = async () => {
        try {
            // Chama a rota que cria o resumo do dia
            const response = await api.get('/dashboard/resumo');
            setDados(response.data);
            setLoading(false);
        } catch (error) {
            toast.error('Erro ao carregar dados do dashboard');
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/');
    };

    if (loading) {
        return <div className='min-h-screen flex items-center justify-center bg-slate-100'>Carregando indicadores... </div>;
    }
    return (
        <div className='min-h-screen bg-slate-100 pb-10'>
            {/** --- Cabeçalho */}
            <header className='bg-white shadow-sm sticky top-0 z-10'>
                <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Store className='text-blue-600' />
                        <span className='font-bold text-lg text-slate-800'> Gestão da Tabacaria</span>
                    </div>
                    <div className='flex items-center gap-4'>
                        <span className='text-sm text-slate-500 hidden sm:inline'>Olá, {usuario.nome}</span>
                        <button onClick={handleLogout} className='text-red-500 hover:bg-red-50 p-2 rounded-full transition'>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/** --- Conteúdo principal --- */}
            <main className="max-w-7xl mx-auto px-4 mt-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Visão Geral de Hoje</h2>

                {/* CARDS INDICADORES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Faturamento Hoje</p>
                                <h3 className="text-3xl font-bold text-slate-800">
                                    {dados?.faturamentoDoDia?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </h3>
                            </div>
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <DollarSign className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Vendas Realizadas</p>
                                <h3 className="text-3xl font-bold text-slate-800">{dados?.vendasDoDia}</h3>
                            </div>
                            <div className="bg-green-100 p-2 rounded-lg">
                                <ShoppingBag className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${dados?.statusCaixa === 'aberto' ? 'border-purple-500' : 'border-red-400'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Status do Caixa</p>
                                <h3 className="text-3xl font-bold text-slate-800 capitalize">
                                    {dados?.statusCaixa}
                                </h3>
                            </div>
                            <div className={`${dados?.statusCaixa === 'aberto' ? 'bg-purple-100' : 'bg-red-100'} p-2 rounded-lg`}>
                                <TrendingUp className={`${dados?.statusCaixa === 'aberto' ? 'text-purple-600' : 'text-red-600'}`} size={24} />
                            </div>
                        </div>
                        {dados?.statusCaixa === 'aberto' && (
                            <div className="mt-2 space-y-1">
                                <p className='text-xs text-slate-400'>
                                    Saldo Inicial: <span className="font-medium text-slate-600">{dados?.saldoCaixaAberto?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </p>
                                <p className='text-xs text-slate-400'>
                                    Aberto por: <span className="font-bold text-slate-700 uppercase">{dados?.nomeFuncionario || 'Error ao encontrar nome'}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ÁREA DE GRÁFICOS REAIS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Gráfico 1: Volume de Vendas (Agora Funcional) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-500" />
                            Movimento do Dia (Simulado)
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="nome" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Espaço para outro gráfico ou avisos */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                        {dados?.produtosComEstoqueBaixo > 0 ? (
                            <>
                                <div className="bg-red-100 p-4 rounded-full mb-4 animate-pulse">
                                    <AlertTriangle size={40} className="text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Atenção ao Estoque</h3>
                                <p className="text-slate-500 mt-2">
                                    Você tem <strong className="text-red-600 text-lg">{dados.produtosComEstoqueBaixo}</strong> produtos<br />
                                    abaixo do nível mínimo.
                                </p>
                                <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">
                                    Ver Lista de Reposição
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-green-100 p-4 rounded-full mb-4">
                                    <ShoppingBag size={40} className="text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Estoque Saudável</h3>
                                <p className="text-slate-500 mt-2">Nenhum alerta de reposição no momento.</p>
                            </>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;