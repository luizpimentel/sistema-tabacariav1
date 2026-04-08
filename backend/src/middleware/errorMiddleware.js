// middleware/errorMiddleware.js
/**
 * @desc Middleware de tratamento de erros. Captura erros lançados
 * em qualquer parte da aplicação (graças ao express-async-handler)
 * e formata uma resposta JSON padronizada.
 */
const errorHandler = (err, req, res, next) => {
    // Define o status code: usa o da resposta se já estiver definido, senão 500
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);

    // Formata a resposta de erro
    res.json({
        message: err.message,
        // Em produção, não exponha o stack trace por segurança
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };