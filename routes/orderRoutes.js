const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create new order
router.post('/', orderController.createOrder);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

// Get single order
router.get('/:id', orderController.getOrder);

// List all orders
router.get('/', orderController.listOrders);

module.exports = router;
