const Product = require("../models/productModel");
const { logAction } = require("../utils/auditLogger");

// ---------- Helper: Pricing ----------
const calculatePricing = (product) => {
  const price = product.pricing?.price || 0;
  const gst = product.pricing?.gst || 0;
  const incentive = product.pricing?.incentive || 0;
  const incentiveType = product.pricing?.incentiveType || "-";

  const gstAmount = (price * gst) / 100;
  const priceInclGST = price + gstAmount;

  let finalPrice = priceInclGST;
  if (incentiveType === "Discount") {
    finalPrice = priceInclGST - incentive;
  }

  const totalBatchPrice = finalPrice * (product.stock || 0);
  const totalGST = gstAmount * (product.stock || 0);

  return {
    pricePerUnit: priceInclGST,
    totalBatchPrice,
    totalGST
  };
};

// ---------- Add Product ----------
exports.addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
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
    console.error("Save error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.keys(err.errors).map(
        (key) => `${key}: ${err.errors[key].message}`
      );
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(400).json({ error: err.message });
  }
};

// ---------- Edit Product ----------
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

// ---------- Activate / Deactivate ----------
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

// ---------- Get All Products ----------
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const formatted = products.map((p) => {
      const pricing = calculatePricing(p);
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        price: pricing.pricePerUnit || 0,
        totalBatchPrice: pricing.totalBatchPrice || 0,
        incentive: p.pricing?.incentive || 0,
        incentiveType: p.pricing?.incentiveType || "-",
        stock: p.stock,
        isActive: p.isActive,
        batches: p.batches
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Get Single Product ----------
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

// ---------- Dashboard Stats ----------
exports.getDashboardStats = async (req, res) => {
  try {
    const products = await Product.find();

    const totalProducts = products.length;
    const lowStockItems = products.filter((p) => p.stock <= 5).length;

    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const expiringProducts = products.filter((p) =>
      p.batches.some(
        (b) => b.expiryDate && b.expiryDate <= next30Days
      )
    ).length;

    const stockValue = products.reduce((sum, p) => {
      const pricing = calculatePricing(p);
      return sum + pricing.totalBatchPrice;
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

// ---------- Delete Product ----------
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
