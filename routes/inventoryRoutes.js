const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

// Add product/raw material to inventory
router.post("/add", inventoryController.addInventoryItem);

// Get full inventory (all/branchwise)
router.get("/", inventoryController.getInventory);

// Consume raw material in production
router.post("/consume", inventoryController.consumeRawMaterial);

// Transfer between branches
router.post("/transfer", inventoryController.transferStock);

// View transaction logs
router.get("/transactions", inventoryController.getTransactions);

module.exports = router;
