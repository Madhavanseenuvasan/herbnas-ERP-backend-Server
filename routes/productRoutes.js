const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ---------- Product CRUD ----------
router.post('/', productController.addProduct);          // Create Product
router.get('/', productController.getAllProducts);       // Get All Products

// ---------- Dashboard / Stats ----------
router.get('/stats/dashboard', productController.getDashboardStats); // Place before :id

// ---------- Single Product ----------
router.get('/:id', productController.getProduct);        // Get Single Product
router.put('/:id', productController.editProduct);       // Update Product
router.delete('/:id', productController.deleteProduct);  // Delete Product

// ---------- Status Updates ----------
router.patch('/:id/activate', productController.activateProduct);    // Activate
router.patch('/:id/deactivate', productController.deactivateProduct); // Deactivate

module.exports = router;
