// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const helmet = require('helmet');
const http = require('http'); // 1. Importar módulo HTTP nativo
const { Server } = require('socket.io'); // 2. Importar Socket.io

// Importação das rotas
const produtosRoutes = require('./routes/produtosRoutes');
const vendasRoutes = require('./routes/vendasRoutes');
const caixaRoutes = require('./routes/caixaRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const funcionariosRoutes = require('./routes/funcionariosRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();
// 3. Criar servidor HTTP a partir do Express
const server = http.createServer(app); 

// 4. Configurar o Socket.io com CORS (para aceitar conexão do celular/frontend)
const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, mude para o domínio do seu frontend
        methods: ["GET", "POST"]
    }
});

// 5. Middleware para disponibilizar o 'io' em todas as requisições
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Middlewares globais
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API do Sistema da Tabacaria está no ar!');
});

// Rotas
app.use('/api', produtosRoutes);
app.use('/api', vendasRoutes);
app.use('/api', caixaRoutes);
app.use('/api', relatoriosRoutes);
app.use('/api', funcionariosRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', authRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 6. Mudar de app.listen para server.listen
server.listen(PORT, () => console.log(`🚀 Servidor e Socket rodando na porta ${PORT}`));