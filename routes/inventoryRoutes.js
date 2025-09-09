const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// -------------------- Inventory Routes --------------------

// Get stock of a product by Product + Location
router.get('/items/:productId/:locationId/stock', inventoryController.getStockByItemId);

// Adjust stock (inward, outward, adjustment, issue)
router.post('/items/adjust', inventoryController.adjustStock);

// Reserve stock for an order
router.post('/items/reserve', inventoryController.reserveStock);

// Release stock (order cancelled / returned)
router.post('/items/release', inventoryController.releaseStock);

// Deduct stock (order fulfilled)
router.post('/items/deduct', inventoryController.deductStock);

// -------------------- Location Routes --------------------

// Get all locations
router.get('/locations', inventoryController.getLocations);

// Create new location
router.post('/locations', inventoryController.createLocation);

module.exports = router;
