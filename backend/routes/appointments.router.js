const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointment.controller');
const authMiddleware = require('../auth.middleware');

// Rutas públicas
router.get('/available/:date', appointmentsController.getAvailableHours);

// Rutas que requieren autenticación
router.use(authMiddleware);  // Aplicar middleware a todas las rutas siguientes

router
    .get('/', appointmentsController.get)
    .get('/:id', appointmentsController.getById)
    .get('/user/:userId', appointmentsController.getByUser)
    .post('/', appointmentsController.create)
    .put('/:id', appointmentsController.update)
    .delete('/:id', appointmentsController.remove);

module.exports = router;