const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/stats/dashboard', productController.getDashboardStats); 
router.get('/:id', productController.getProduct);
router.post('/', productController.addProduct);
router.put('/:id', productController.editProduct);
router.patch('/:id/deactivate', productController.deactivateProduct);
router.patch('/:id/activate', productController.activateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
