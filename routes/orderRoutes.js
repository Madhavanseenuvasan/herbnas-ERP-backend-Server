const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// ---------- Order CRUD ----------

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders (optionally filtered by branch/status)
router.get('/', orderController.listOrders);

// Get a single order by ID
router.get('/:id', orderController.getOrder);

// Update full order (customer, products, totals, etc.)
router.put('/:id', orderController.updateOrder);

// Update only order status or payment status
router.patch('/:id/status', orderController.updateOrder);

// Process a return for an order
router.post('/:id/return', orderController.processReturn);

router.delete('/:id', orderController.deleteOrder);

module.exports = router;
