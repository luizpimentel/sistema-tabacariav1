import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Envia o token automaticamente em toda requisição
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de resposta
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Se o error for 401 ou 403
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {

            // Verifica se já está na tela de login
            if (window.location.pathname !== '/') {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                toast.error('Sessão expirada. Faça login novamente!');

                //Redirecionamento forçado
                window.location.href = '/'
            }
        }
        return Promise.reject(error);
    }
);
export default api;