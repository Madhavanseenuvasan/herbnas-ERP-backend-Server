const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);

router.post('/', productController.addProduct);
router.put('/:id', productController.editProduct);

router.patch('/:id/deactivate', productController.deactivateProduct);
router.patch('/:id/activate', productController.activateProduct);

router.patch('/:id/pricing', productController.setPricingTiers);
router.post('/:id/spec', productController.addManufacturingSpec);

router.patch('/:id/bom', productController.setBOM);
router.post('/:id/batch', productController.addBatch);

router.get('/dashboard/stats', productController.getDashboardStats);
router.get('/list', productController.getProductList);
router.get('/:id', productController.getProduct);

module.exports = router;
