const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/service.controller');
const authMiddleware = require('../auth.middleware');

const isAdmin = (req, res, next) => {
    if (req.user?.rol !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }
    next();
};

// Rutas públicas (no requieren autenticación)
router.get('/', servicesController.get);
router.get('/:id', servicesController.getById);

// Rutas protegidas (requieren autenticación y rol de admin)
router.post('/', authMiddleware, isAdmin, servicesController.create);
router.put('/:id', authMiddleware, isAdmin, servicesController.update);
router.delete('/:id', authMiddleware, isAdmin, servicesController.remove);

module.exports = router;