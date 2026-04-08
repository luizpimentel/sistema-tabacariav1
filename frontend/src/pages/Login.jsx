import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import logoImg from '../assets/logo/Logo_DaBoa.png'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !senha) {
        return toast.warning("Preencha todos os campos.");
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, funcionario } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(funcionario));
      
      api.defaults.headers.Authorization = `Bearer ${token}`;

      toast.success(`Bem-vindo, ${funcionario.nome}!`);
      navigate('/pdv');

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Erro ao conectar com o servidor.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fundo: Gradiente profundo (Verde Floresta -> Tabaco Escuro)
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-stone-900 to-amber-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Efeitos de Fundo (Luzes ambientais) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-green-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Cartão de Login */}
      <div className="bg-[#fffdf5] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 border border-amber-900/10">
        
        {/* Cabeçalho com Logo */}
        <div className="bg-gradient-to-b from-[#fdfbf0] to-[#fffdf5] pt-8 pb-6 px-8 text-center flex flex-col items-center border-b border-amber-100">
            {/* LOGO */}
            <div className="w-40 h-40 mb-2 flex items-center justify-center relative">
                {/* Efeito de brilho atrás da logo */}
                <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full"></div>
                <img 
                    src={logoImg} 
                    alt="DaBoa Tabacaria" 
                    className="w-full h-full object-contain relative z-10 drop-shadow-lg rounded" 
                />
            </div>
            <h2 className="text-amber-900 font-bold text-lg tracking-wide uppercase">Acesso ao Sistema</h2>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-green-900 ml-1">Email</label>
            <div className="relative group">
                <div className="absolute left-3 top-3.5 text-green-700/60 group-focus-within:text-green-700 transition">
                    <User size={20} />
                </div>
                <input 
                    type="email" 
                    placeholder="usuario@daboashop.com.br"
                    className="w-full pl-10 pr-4 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition text-stone-800 placeholder-stone-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-green-900 ml-1">Senha</label>
            <div className="relative group">
                <div className="absolute left-3 top-3.5 text-green-700/60 group-focus-within:text-green-700 transition">
                    <Lock size={20} />
                </div>
                <input 
                    type={mostrarSenha ? "text" : "password"} 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-amber-50/50 border border-amber-200 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-100 outline-none transition text-stone-800 placeholder-stone-400"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600 transition"
                >
                    {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>

          {/* Botão Entrar */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-700 to-green-800 text-white font-bold py-4 rounded-xl hover:from-green-800 hover:to-green-900 transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group mt-4 border border-green-900/10"
          >
            {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    <span>ENTRAR</span>
                    <LogIn size={20} className="text-amber-200 group-hover:translate-x-1 transition" />
                </>
            )}
          </button>

        </form>
        
        {/* Rodapé Decorativo */}
        <div className="bg-[#fdfbf0] p-4 text-center border-t border-amber-100">
            <p className="text-xs font-medium text-stone-500">DaBoa Tabacaria & Smokeshop</p>
        </div>
      </div>
    </div>
  );
};

export default Login;