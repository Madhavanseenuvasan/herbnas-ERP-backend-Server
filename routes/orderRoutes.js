  const express = require('express');
  const router = express.Router();
  const orderController = require('../controllers/orderController');

  // Create new order
  router.post('/', orderController.createOrder);

  // Update order status (confirm, dispatch, deliver, etc.)
  router.put('/:id/status', orderController.updateOrderStatus);

  // Process return
  router.post('/:id/return', orderController.processReturn);

  // Get single order
  router.get('/:id', orderController.getOrder);

  // List all orders (filters: branchId, status)
  router.get('/', orderController.listOrders);

  module.exports = router;
