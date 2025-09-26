// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Create
router.post('/', productController.createProduct);

// Read (list with filters/pagination)
router.get('/', productController.getAllProducts);

// Read single by Mongo _id or productId or numeric id
router.get('/:identifier', productController.getProductByIdentifier);

// Update partial
router.put('/:identifier', productController.updateProduct);   // full replace-ish
router.patch('/:identifier', productController.updateProduct); // partial updates also supported

// Delete
router.delete('/:identifier', productController.deleteProduct);

// Change status
router.patch('/:identifier/status', productController.changeStatus);

module.exports = router;
