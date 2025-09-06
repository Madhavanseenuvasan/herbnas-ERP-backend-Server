const Product = require("../models/productModel");
const { logAction } = require("../utils/auditLogger");

// ---------- Helper: Pricing ----------
const calculatePricing = (product) => {
  const gstAmount = (product.price * product.gst) / 100;
  const priceInclGST = product.price + gstAmount;

  let finalPrice = priceInclGST;
  if (product.incentiveType === "Discount") {
    finalPrice = priceInclGST - product.incentive;
  } else if (product.incentiveType === "Bonus" || product.incentiveType === "Commission") {
    finalPrice = priceInclGST; // incentives applied later
  }

  const totalBatchPrice = finalPrice * product.stockQuantity;
  const totalGST = gstAmount * product.stockQuantity;

  return {
    pricePerUnit: priceInclGST,
    totalBatchPrice,
    totalGST
  };
};

// ---------- Add Product ----------
// Add Product
exports.addProduct = async (req, res) => {
  try {
    console.log("Incoming body:", req.body); // 🔍 log what frontend sends

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
    console.error("Save error:", err); // 🔍 full error on server
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

// ---------- Get All Products (for UI table) ----------
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
        incentive: p.incentive || 0,
        incentiveType: p.incentiveType || "-",
        stock: p.stockQuantity,
        isActive: p.isActive
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
    const lowStockItems = products.filter((p) => p.stockQuantity <= 5).length;

    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const expiringProducts = products.filter(
      (p) => p.expiryDate && p.expiryDate <= next30Days
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
