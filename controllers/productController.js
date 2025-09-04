const Product = require('../models/productModel');
const { logAction } = require('../utils/auditLogger');

// Add Product (full flow)
exports.addProduct = async (req, res) => {
  try {
    // Assume UI gathers data in one POST
    const {
      name, category, sku, supplier, weight, description,
      basePrice, gst, stock,
      pricing, // { price, incentive, incentiveType, tax }
      batches  // [{ batchNo, lotNo, productionDate, expiryDate, location, quantityProduced }]
    } = req.body;

    const product = new Product({
      name, category, sku, supplier, weight, description,
      basePrice, gst, stock, pricing, batches
    });

    await product.save();

    await logAction({
      module: 'Product',
      action: 'CREATE',
      entityId: product._id,
      performedBy: req.user?._id,
      details: req.body
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit product (update all main product fields, except batches)
exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    await logAction({
      module: 'Product',
      action: 'UPDATE',
      entityId: id,
      performedBy: req.user?._id,
      details: req.body
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deactivate/activate
exports.deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    await logAction({
      module: 'Product', action: 'DEACTIVATE',
      entityId: id, performedBy: req.user?._id
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.activateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    await logAction({
      module: 'Product', action: 'ACTIVATE',
      entityId: id, performedBy: req.user?._id
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new batch (append to product)
exports.addBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batchData = req.body;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    product.batches.push(batchData);
    await product.save();
    await logAction({
      module: 'Product',
      action: 'ADD_BATCH',
      entityId: id,
      performedBy: req.user?._id,
      details: batchData
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("name sku category supplier stock pricing isActive");
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get single product
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
