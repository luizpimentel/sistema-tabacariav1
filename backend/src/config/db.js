// config/db.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Tenta conectar ao MongoDB usando a URI do .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erro ao conectar ao MongoDB: ${error.message}`);
    // Encerra o processo com falha se a conexão não for estabelecida
    process.exit(1);
  }
};

module.exports = connectDB;