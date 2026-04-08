// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { proteger, autorizar } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/resumo
router.get(
    '/dashboard/resumo',
    proteger,
    autorizar('caixa', 'gerente', 'supervisor'), // Todos logados podem ver
    dashboardController.getDashboardResumo
);

module.exports = router;