const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// ---------- Order CRUD ----------

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders (optionally filtered by branch/status)
router.get('/', orderController.listOrders);

// Get a single order by orderId
router.get('/:orderId', orderController.getOrder);

// Update full order (customer, products, totals, etc.) by orderId
router.put('/:orderId', orderController.updateOrder);

// Update only order status or payment status by orderId
router.patch('/:orderId/status', orderController.updateOrderStatus);

// Process a return for an order by orderId
router.post('/:orderId/return', orderController.processReturn);

// Delete order by orderId
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router;
