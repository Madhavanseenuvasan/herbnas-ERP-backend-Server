const Production = require("../models/productionModel");

// Create Production Batch
exports.createProduction = async (req, res) => {
  try {
    const production = new Production(req.body);
    await production.save();
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
