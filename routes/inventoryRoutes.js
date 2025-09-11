const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Get stock of a product by Product + Location
router.get('/:productId/:locationId/stock', inventoryController.getStockByItemId);

// Adjust stock manually (INWARD, OUTWARD, ADJUSTMENT)
router.post('/adjust', inventoryController.adjustStock);

router.get('/',inventoryController.listInventory)

// Get all locations
router.get('/locations', inventoryController.getLocations);

// Create new location
router.post('/locations', inventoryController.createLocation);

module.exports = router;
