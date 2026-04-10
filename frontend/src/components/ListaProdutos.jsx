import { Search, Store } from "lucide-react";

const ListaProdutos = ({ produtos, busca, setBusca, adicionarAoCarrinho, caixaAberto }) => {

    // Filtro
    const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm p-4">

            {/** Barra de busca */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input type="text" placeholder="Buscar produto por nome..." value={busca} onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition" />
            </div>

            {/** Grid de Produtos */}
            <div className="flex-1 overflow-y-auto pb-24 lg:pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                    {produtosFiltrados.map((produto) => (
                        <button key={produto._id} onClick={() => caixaAberto && adicionarAoCarrinho(produto)}
                            className={`
                        bg-white rounded-xl border border-amber-100 p-3 flex flex-col gap-2 relative group transition-all duration-200
                        ${!caixaAberto ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:shadow-lg hover:border-amber-300 cursor-pointer'}
                        `}>
                            
                        </button>
                    ))}

                    {produtosFiltrados.lenght === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-500">
                            Nenhum produto encontrado com "{busca}"!.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListaProdutos;