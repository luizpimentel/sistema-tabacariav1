import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, LayoutDashboard, Package, Users, LogOut, 
  ChevronLeft, ChevronRight, Store 
} from 'lucide-react';
import logoImg from '../assets/logo/Logo_DaBoa.png'; // <--- Importando a Logo

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const cargo = usuario.cargo || 'caixa';

  // Estado para controlar se o menu está expandido ou recolhido (Desktop)
  const [menuExpandido, setMenuExpandido] = useState(true);

  const menuItems = [
    { nome: 'PDV', path: '/pdv', icon: ShoppingCart, permissoes: ['caixa', 'supervisor', 'gerente'] },
    { nome: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permissoes: ['gerente'] },
    { nome: 'Produtos', path: '/produtos', icon: Package, permissoes: ['supervisor', 'gerente'] },
    { nome: 'Funcionários', path: '/funcionarios', icon: Users, permissoes: ['gerente'] }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    // Fundo geral do sistema
    <div className="flex h-screen bg-[#fffdf5] overflow-hidden font-sans">
      
      {/* --- MENU LATERAL (DESKTOP) / INFERIOR (MOBILE) --- */}
      <aside 
        className={`
          bg-green-900 text-amber-50 transition-all duration-300 shadow-2xl z-[60]
          /* Mobile: Fixo embaixo, horizontal */
          fixed bottom-0 left-0 w-full h-16 flex flex-row items-center justify-around border-t border-green-800
          /* Desktop: Lateral, vertical, largura dinâmica */
          lg:relative lg:h-screen lg:flex-col lg:border-r lg:border-green-800
          ${menuExpandido ? 'lg:w-64' : 'lg:w-20'}
        `}
      >
        
        {/* TOOGLE DE MENU (SÓ DESKTOP) */}
        <button 
            onClick={() => setMenuExpandido(!menuExpandido)}
            className="hidden lg:flex absolute -right-3 top-20 bg-amber-500 text-green-900 rounded-full p-1 shadow-lg hover:bg-amber-400 transition z-50"
        >
            {menuExpandido ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* LOGO / TÍTULO */}
        <div className={`hidden lg:flex items-center justify-center h-24 border-b border-green-800/50 transition-all overflow-hidden ${menuExpandido ? 'px-4' : 'px-0'}`}>
          {menuExpandido ? (
             /* --- LOGO QUANDO EXPANDIDO --- */
             <div className="flex items-center gap-2 animate-fade-in">
                <img src={logoImg} alt="DaBoa" className="h-20 w-auto object-contain drop-shadow-sm" />
             </div>
          ) : (
             /* Ícone quando recolhido (para economizar espaço) */
             <Store className="text-amber-400" size={28} />
          )}
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex lg:flex-col flex-1 w-full lg:py-6 lg:space-y-2 lg:px-3 justify-around lg:justify-start">
          {menuItems.map((item) => {
            if (!item.permissoes.includes(cargo)) return null;
            const ativo = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  flex items-center gap-3 p-2 lg:p-3 rounded-xl transition-all duration-200 group relative
                  ${ativo 
                    ? 'text-amber-400 bg-green-800 lg:bg-green-800/50 lg:shadow-inner' 
                    : 'text-green-200/70 hover:text-amber-100 hover:bg-green-800/30'
                  }
                `}
                title={item.nome}
              >
                <item.icon size={24} className={ativo ? "drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" : ""} />
                
                {/* Texto só aparece se expandido no Desktop. No mobile some. */}
                <span className={`hidden lg:block font-medium whitespace-nowrap transition-opacity duration-200 ${menuExpandido ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.nome}
                </span>
                
                {/* Bolinha de ativo */}
                {ativo && <div className="hidden lg:block absolute right-2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />}
              </button>
            );
          })}
        </nav>

        {/* USER / LOGOUT (DESKTOP) */}
        <div className="hidden lg:block p-4 border-t border-green-800/50">
           <div className={`flex items-center gap-3 mb-4 px-1 transition-all ${menuExpandido ? 'justify-start' : 'justify-center'}`}>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/50 shrink-0">
                    {usuario.nome?.charAt(0).toUpperCase()}
                </div>
                {menuExpandido && (
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate text-green-100">{usuario.nome}</p>
                        <p className="text-xs text-green-400/70 capitalize">{usuario.cargo}</p>
                    </div>
                )}
           </div>
           <button onClick={handleLogout} className={`flex items-center gap-2 text-red-400 hover:text-red-300 transition w-full ${menuExpandido ? 'justify-start px-2' : 'justify-center'}`}>
                <LogOut size={20} />
                {menuExpandido && <span className="text-sm font-bold">Sair</span>}
           </button>
        </div>

      </aside>

      {/* --- CONTEÚDO --- */}
      <main className="flex-1 relative overflow-hidden flex flex-col h-full bg-[#fffdf5]">
        <div className="flex-1 overflow-auto pb-16 lg:pb-0"> 
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default Layout;