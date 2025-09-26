const express = require("express");
const router = express.Router();
const productionController = require("../controllers/productionController");

// CRUD routes
router.post("/", productionController.createProduction);
router.get("/", productionController.getAllProductions);
router.get("/:id", productionController.getProductionById);
router.put("/:id", productionController.updateProduction);
router.delete("/:id", productionController.deleteProduction);

// Special actions
router.patch("/:id/quality-status", productionController.updateQualityStatus);
router.patch("/:id/release", productionController.releaseBatch);

module.exports = router;
