const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ---------- Product CRUD ----------
router.post('/', productController.addProduct);
router.get('/', productController.getAllProducts);

// ---------- Dashboard / Stats ----------
router.get('/stats/dashboard', productController.getDashboardStats);

// ---- Raw Material Routes ----
router.post("/raw-materials", productController.addRawMaterial);
router.get("/raw-materials", productController.getAllRawMaterials);
router.get("/raw-materials/:id", productController.getRawMaterial);
router.put("/raw-materials/:id", productController.editRawMaterial);
router.delete("/raw-materials/:id", productController.deleteRawMaterial);

// ---- Finished Goods Routes ----
router.post("/finished-goods", productController.addFinishedGood);
router.get("/finished-goods", productController.getAllFinishedGoods);
router.get("/finished-goods/:id", productController.getFinishedGood);
router.put("/finished-goods/:id", productController.editFinishedGood);
router.delete("/finished-goods/:id", productController.deleteFinishedGood);

// ---------- Single Product ----------
router.get('/:id', productController.getProduct);
router.put('/:id', productController.editProduct);
router.delete('/:id', productController.deleteProduct);

// ---------- Status Updates ----------
router.patch('/:id/activate', productController.activateProduct);
router.patch('/:id/deactivate', productController.deactivateProduct);

module.exports = router;
