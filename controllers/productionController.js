const Production = require("../models/productionModel");
const { InventoryItem, InventoryTransaction } = require("../models/inventoryModel");

exports.createProduction = async (req, res) => {
  try {
    // 1. Save production batch
    const production = new Production(req.body);
    await production.save();

    // 2. Create inventory item for the product
    const inventoryItem = new InventoryItem({
      itemRef: production._id ,
      itemType: "Product",           // ✅ matches enum
      branch: req.body.branch,       // optional
      available: production.quantityProduced,
      unit: production.unit
    });
    console.log("Production ID:", production._id);
    await inventoryItem.save();

    // 3. Log transaction for traceability
    const transaction = new InventoryTransaction({
      itemRef: production._id,
      itemType: "Product",
      branch: req.body.branch,
      action: "Add",
      quantity: production.quantityProduced,
      unit: production.unit,
      relatedProductionBatch: production._id,
      remarks: "Production batch created and added to inventory"
    });
    await transaction.save();

    res.status(201).json(production);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Get All Productions
exports.getAllProductions = async (req, res) => {
  try {
    const productions = await Production.find().sort({ createdAt: -1 });
    res.json(productions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Single Production by ID
exports.getProductionById = async (req, res) => {
  try {
    const production = await Production.findById(req.params.id);
    if (!production) return res.status(404).json({ error: "Production not found" });
    res.json(production);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Production Batch
exports.updateProduction = async (req, res) => {
  try {
    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Production not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Production Batch
exports.deleteProduction = async (req, res) => {
  try {
    const deleted = await Production.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Production not found" });
    res.json({ message: "Production deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Quality Status
exports.updateQualityStatus = async (req, res) => {
  try {
    const { qualityStatus } = req.body;
    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      { qualityStatus },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Production not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Release Batch
exports.releaseBatch = async (req, res) => {
  try {
    const updated = await Production.findByIdAndUpdate(
      req.params.id,
      { batchReleased: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Production not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
