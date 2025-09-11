const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// -------------------- Inventory APIs --------------------

// List all inventory (with product, batch, category, supplier info)
router.get('/', inventoryController.listInventory);

// Get stock of a product by Product + Location
router.get('/:productId/:locationId/stock', inventoryController.getStockByItemId);

// Adjust stock manually (INWARD, OUTWARD, ADJUSTMENT)
router.post('/adjust', inventoryController.adjustStock);

// Edit inventory
router.put('/:inventoryId', inventoryController.editInventory);

// Delete inventory
router.delete('/:inventoryId', inventoryController.deleteInventory);

// -------------------- Location APIs --------------------

// Get all locations
router.get('/locations/all', inventoryController.getLocations);

// Create new location
router.post('/locations', inventoryController.createLocation);

// Update location
router.put('/locations/:locationId', inventoryController.updateLocation);

// Delete location
router.delete('/locations/:locationId', inventoryController.deleteLocation);

module.exports = router;
