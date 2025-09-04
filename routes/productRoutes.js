const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);            // list
router.get('/:id', productController.getProduct);             // details
router.post('/', productController.addProduct);               // create
router.put('/:id', productController.editProduct);            // update/edit
router.patch('/:id/deactivate', productController.deactivateProduct);
router.patch('/:id/activate', productController.activateProduct);
router.post('/:id/batch', productController.addBatch);        // add batch

module.exports = router;
