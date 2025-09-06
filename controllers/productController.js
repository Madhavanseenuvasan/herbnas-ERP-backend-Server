const Product = require("../models/productModel");
const { logAction } = require("../utils/auditLogger");

// Helper to calculate GST & Incentives
const calculatePricing = (product) => {
  const gstAmount = (product.price * product.gst) / 100;
  const priceInclGST = product.price + gstAmount;

  let finalPrice = priceInclGST;
  if (product.incentiveType === "Discount") {
    finalPrice = priceInclGST - product.incentive;
  } else if (product.incentiveType === "Cashback") {
    finalPrice = priceInclGST; // Cashback applied later
  }

  const totalGST = gstAmount * product.stockQuantity;
  const totalAmount = finalPrice * product.stockQuantity;

  return {
    pricePerUnitInclGST: priceInclGST,
    finalUnitPrice: finalPrice,
    totalGST,
    totalAmount
  };
};

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      supplier,
      weight,
      description,
      batchNo,
      lotNo,
      manufactureDate,
      expiryDate,
      location,
      price,
      gst,
      stockQuantity,
      incentive,
      incentiveType
    } = req.body;

    const product = new Product({
      name,
      sku,
      category,
      supplier,
      weight,
      description,
      batchNo,
      lotNo,
      manufactureDate,
      expiryDate,
      location,
      price,
      gst,
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

    const formatted = products.map((p) => {
      const pricing = calculatePricing(p);
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        gst: p.gst,
        incentive: p.incentive,
        incentiveType: p.incentiveType,
        stockQuantity: p.stockQuantity,
        ...pricing,
        isActive: p.isActive
      };
    });

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

    const pricing = calculatePricing(product);
    res.json({ ...product.toObject(), ...pricing });
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

    const stockValue = products.reduce((sum, p) => {
      const pricing = calculatePricing(p);
      return sum + pricing.totalAmount;
    }, 0);

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
