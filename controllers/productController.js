const { Product, RawMaterial, FinishedGood } = require("../models/productModel");
const { logAction } = require("../utils/auditLogger");

// ---------- Helper: Pricing Calculation (array version) ----------
const calculatePricing = (input, tierIndex = 0) => {
  const pricingArr = Array.isArray(input.pricing) ? input.pricing : [];
  const pricing = pricingArr[tierIndex] || {};
  const price = Number(pricing.price ?? 0);
  const gst = Number(pricing.gst ?? 0);
  const incentive = Number(pricing.incentive ?? 0);
  const incentiveType = pricing.incentiveType || "-";
  const stock = Number(input.stock) || 0;

  const gstAmount = (price * gst) / 100;
  const priceInclGST = price + gstAmount;

  let finalPrice = priceInclGST;
  if (incentiveType === "Discount") {
    finalPrice = priceInclGST - incentive;
  }

  const totalBatchPrice = finalPrice * stock;
  const totalGST = gstAmount * stock;

  return {
    pricePerUnit: priceInclGST,
    finalUnitPrice: finalPrice,
    totalGST,
    totalBatchPrice,
    grandTotal: totalBatchPrice
  };
};

// ---------- Add Product ----------
exports.addProduct = async (req, res) => {
  try {
    // If batches not sent, create a default batch using stock
    if (!req.body.batches || req.body.batches.length === 0) {
      req.body.batches = [{
        batchNo: `BATCH-${Date.now()}`,
        lotNo: "DEFAULT",
        productionDate: new Date(),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        location: "Default",
        quantityProduced: req.body.stock || 0,
        totalBatchPrice: 0
      }];
    }

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

// ---------- Get All Products with Pagination ----------
exports.getAllProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    // Format products
    const formatted = products.map((p) => {
      const pricingArr = Array.isArray(p.pricing) ? p.pricing : [];
      const tier = pricingArr[0] || {};
      const calculated = calculatePricing(p);
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        supplier: p.supplier,
        weight: p.weight,
        description: p.description,
        pricing: pricingArr, // send all pricing tiers for UI
        price: tier.price || 0,
        incentive: tier.incentive || 0,
        incentiveType: tier.incentiveType || "-",
        stock: p.stock,
        isActive: p.isActive,
        totalBatchPrice: calculated.totalBatchPrice || 0,
        totalGST: calculated.totalGST || 0,
        batches: p.batches || []
      };
    });

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products: formatted
    });
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

    const tier = Array.isArray(product.pricing) ? product.pricing[0] || {} : {};
    const calculated = calculatePricing(product);
    res.json({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      supplier: product.supplier,
      weight: product.weight,
      description: product.description,
      price: tier.price || 0,
      incentive: tier.incentive || 0,
      incentiveType: tier.incentiveType || "-",
      stock: product.stock,
      isActive: product.isActive,
      totalBatchPrice: calculated.totalBatchPrice || 0,
      totalGST: calculated.totalGST || 0,
      batches: product.batches || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Price Calculation API (for UI live calculation) ----------
exports.calculatePricing = (req, res) => {
  try {
    // Expects body: { pricing: [ { ... } ], stock: ... }
    // Uses first tier by default, or you can add index param
    const pricing = calculatePricing(req.body);
    res.json(pricing);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
      (p.batches || []).some(
        (b) => b.expiryDate && new Date(b.expiryDate) <= next30Days
      )
    ).length;

    const stockValue = products.reduce((sum, p) => {
      const calculated = calculatePricing(p);
      return sum + calculated.totalBatchPrice;
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

// Add Raw Material
exports.addRawMaterial = async (req, res) => {
  try {
    const material = new RawMaterial(req.body);
    await material.save();

    await logAction({
      module: "RawMaterial",
      action: "CREATE",
      entityId: material._id,
      performedBy: req.user?._id,
      details: req.body
    });

    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit Raw Material
exports.editRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await RawMaterial.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!material) return res.status(404).json({ error: "Raw Material not found" });

    await logAction({
      module: "RawMaterial",
      action: "UPDATE",
      entityId: id,
      performedBy: req.user?._id,
      details: req.body
    });

    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Get All Raw Materials with Pagination ----------
exports.getAllRawMaterials = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      RawMaterial.find().skip(skip).limit(limit),
      RawMaterial.countDocuments()
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      materials
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get Single Raw Material
exports.getRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await RawMaterial.findById(id);
    if (!material) return res.status(404).json({ error: "Raw Material not found" });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Raw Material
exports.deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await RawMaterial.findByIdAndDelete(id);
    if (!material) return res.status(404).json({ error: "Raw Material not found" });

    await logAction({
      module: "RawMaterial",
      action: "DELETE",
      entityId: id,
      performedBy: req.user?._id
    });

    res.json({ message: "Raw Material deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- FINISHED GOODS CRUD --------------------

// Add Finished Good
exports.addFinishedGood = async (req, res) => {
  try {
    const product = new FinishedGood(req.body);
    await product.save();

    await logAction({
      module: "FinishedGood",
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

// Edit Finished Good
exports.editFinishedGood = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await FinishedGood.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) return res.status(404).json({ error: "Finished Good not found" });

    await logAction({
      module: "FinishedGood",
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

// ---------- Get All Finished Goods with Pagination ----------
exports.getAllFinishedGoods = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      FinishedGood.find().skip(skip).limit(limit),
      FinishedGood.countDocuments()
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get Single Finished Good
exports.getFinishedGood = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await FinishedGood.findById(id);
    if (!product) return res.status(404).json({ error: "Finished Good not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Finished Good
exports.deleteFinishedGood = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await FinishedGood.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ error: "Finished Good not found" });

    await logAction({
      module: "FinishedGood",
      action: "DELETE",
      entityId: id,
      performedBy: req.user?._id
    });

    res.json({ message: "Finished Good deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
