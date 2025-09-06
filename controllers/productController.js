const Product = require("../models/productModel");
const { logAction } = require("../utils/auditLogger");

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      supplier,
      batchNumber,
      expiryDate,
      mrp,
      gstPercent,
      stockQuantity,
      incentive,
      incentiveType
    } = req.body;

    const product = new Product({
      name,
      sku,
      category,
      supplier,
      batchNumber,
      expiryDate,
      mrp,
      gstPercent,
      stockQuantity,
      incentive,
      incentiveType
    });

    await product.save();

    await logAction({
      module: "Product",
      action: "CREATE",
      entityId: product._id,
      performedBy: req.user?._id,
      details: req.body
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit Product
exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: "Product",
      action: "UPDATE",
      entityId: id,
      performedBy: req.user?._id,
      details: req.body
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Activate / Deactivate
exports.deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: "Product",
      action: "DEACTIVATE",
      entityId: id,
      performedBy: req.user?._id
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.activateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: "Product",
      action: "ACTIVATE",
      entityId: id,
      performedBy: req.user?._id
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const formatted = products.map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      mrp: p.mrp,
      gstPercent: p.gstPercent,
      incentive: p.incentive,
      incentiveType: p.incentiveType,
      stockQuantity: p.stockQuantity,
      pricePerUnitInclGST: p.pricePerUnitInclGST,
      finalUnitPrice: p.finalUnitPrice,
      totalGST: p.totalGST,
      totalAmount: p.totalAmount,
      isActive: p.isActive
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Single Product
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const products = await Product.find();

    const totalProducts = products.length;

    const lowStockItems = products.filter((p) => p.stockQuantity <= 5).length;

    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const expiringProducts = products.filter(
      (p) => p.expiryDate && p.expiryDate <= next30Days
    ).length;

    const stockValue = products.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0
    );

    res.json({
      totalProducts,
      lowStockItems,
      expiringProducts,
      stockValue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: "Product",
      action: "DELETE",
      entityId: id,
      performedBy: req.user?._id
    });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
