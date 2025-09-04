const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// -------------------- Product Routes --------------------

// Get all products with filters + pagination
router.get('/items', inventoryController.getAllItems);

// Get single product by ID
router.get('/items/:id', inventoryController.getSingleItem);

// Create new product
router.post('/items', inventoryController.createItem);

// Update product
router.put('/items/:id', inventoryController.updateItem);

// Delete product
router.delete('/items/:id', inventoryController.deleteItem);

// Get stock of a product by ID
router.get('/items/:itemId/stock', inventoryController.getStockByItemId);

// Adjust stock (inward, outward, adjustment, issue)
router.post('/items/adjust', inventoryController.adjustStock);

// Get all locations
router.get('/locations', inventoryController.getLocations);

// Create new location
router.post('/locations', inventoryController.createLocation);

module.exports = router;
