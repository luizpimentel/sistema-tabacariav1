import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Principal
import Layout from './components/Layout';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Produtos from './pages/Produtos';
import Funcionarios from './pages/Funcionarios';

// Proteção de Rota
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to='/pdv' replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rota Pública (Login) - Fica fora do Layout */}
        <Route path="/" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Rotas Protegidas - Ficam DENTRO do Layout */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>

          <Route path="/pdv" element={<PDV />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/funcionarios" element={<Funcionarios />} />

        </Route>

        <Route path='*' element={<Navigate to='/' replace />} />

      </Routes>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </BrowserRouter>
  );
}

export default App;