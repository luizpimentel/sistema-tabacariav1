import { useState, useEffect } from "react";
import api from '../services/api';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, KeyRound, Shield, User } from 'lucide-react';

const Funcionarios = () => {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);

    // MOdais
    const [modalFormAberto, setModalFormAberto] = useState(false);
    const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
    const [funcionarioEditando, setFuncionarioEditando] = useState(null);

    // Formulário de cadastro/edição
    const [formData, setFormData] = useState({
        nome: '', email: '', telefone: '', cargo: 'caixa', senha: ''
    });

    //Reset de senha
    const [novaSenha, setNovaSenha] = useState('');

    useEffect(() => {
        carregarFuncionarios();
    }, []);

    // Carrega os funcionários
    const carregarFuncionarios = async () => {
        try {
            const response = await api.get('/funcionarios');
            setFuncionarios(response.data);
        } catch (error) {
            toast.error('Erro ao carregar funcionários.');
        } finally {
            setLoading(false);
        }
    };

    // Ações do formunlário
    const abrirModalForm = (func = null) => {
        if (func) {
            setFuncionarioEditando(func);
            setFormData({
                nome: func.nome,
                email: func.email,
                telefone: func.telefone,
                cargo: func.cargo,
                senha: '' //Não é editada aqui
            });
        } else {
            setFuncionarioEditando(null);
            setFormData({ nome: '', email: '', telefone: '', cargo: 'caixa', senha: '' });
        }
        setModalFormAberto(true);
    };

    const salvarFuncionario = async (e) => {
        e.preventDefault();
        try {
            if (funcionarioEditando) {
                //Remoção da senha do payload
                const { senha, ...dadosAtualizacao } = formData;
                await api.put(`/funcionarios/${funcionarioEditando._id}`, dadosAtualizacao);
                toast.success('Funcionário atualizado');
            } else {
                await api.post('/auth/registrar', fromData);
                toast.success('Funcinário atualizado!');
            }
            setModalFormAberto(false);
            carregarFuncionarios();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar.');
        }
    };

    // Ações de senha
    const abrirModalSenha = (func) => {
        setFuncionarioEditando(func);
        setNovaSenha('');
        setModalSenhaAberto(true);
    };

    const resetarSenha = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/funcionarios/${funcionarioEditando._id}/reset-senha`, {
                novaSenha
            });
            toast.success('Senha redefinida com sucesso!');
            setModalSenhaAberto(false);
        } catch (error) {
            toast.error('Erro ao redefinir senha.')
        }
    };

    const deletarFunconario = async (id) => {
        if (window.confirm('Tem certeza? Essa ação não pode ser desfeta.')) {
            try {
                await api.delete(`/funcionarios/${id}`);
                toast.success('Funcionário removido.');
                carregarFuncionarios();
            } catch (error) {
                toast.error('Erro ao remover.');
            }
        }
    };

    // Helper para cor do cargo
    const getCargoColor = (cargo) => {
        switch (cargo) {
            case 'gerente': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'supervisor': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-green-100 text-green-800 border-green-200';
        }
    };
    return (
        <div className="p-6 min-h-screen bg-slate-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <User size={28} /> Equipe
                    </h1>
                    <button
                        onClick={() => abrirModalForm() }
                        className=""
                    ></button>
                </div>
            </div>
        </div>
    )
}

export default Funcionarios;
