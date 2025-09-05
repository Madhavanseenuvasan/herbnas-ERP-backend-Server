const Product = require('../models/productModel');
const { logAction } = require('../utils/auditLogger');

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const { name, sku, pricing, stock, batches } = req.body;

    const product = new Product({
      name,
      sku,
      pricing,
      stock,
      batches
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

// Edit Product
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

// Activate / Deactivate
exports.deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: 'Product',
      action: 'DEACTIVATE',
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
    const product = await Product.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: 'Product',
      action: 'ACTIVATE',
      entityId: id,
      performedBy: req.user?._id
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Batch
exports.addBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batchData = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.batches.push(batchData);

    // Update stock when new batch is added
    product.stock += batchData.quantityProduced || 0;

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

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .select("name sku pricing stock batches.isActive");
    res.json(products);
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
