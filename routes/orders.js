const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

// 🛒 POST /api/orders - Créer une commande
router.post('/', auth, orderController.createOrder);

// 📋 GET /api/orders/my-orders - Mes commandes
router.get('/my-orders', auth, orderController.getMyOrders);

// 🔍 GET /api/orders/:id - Détails d'une commande
router.get('/:id', auth, orderController.getOrderById);

module.exports = router;