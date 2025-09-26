// controllers/productController.js
const Product = require('../models/productModel');

// create product
exports.createProduct = async (req, res) => {
  try {
    const { productId, productName, mrp, gstPercent, ...rest } = req.body;

    if (!productId || !productName || mrp === undefined || gstPercent === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalPrice = +(mrp * (1 + gstPercent / 100)).toFixed(2);

    const product = await Product.create({
      productId,
      productName, // this is Production ObjectId
      mrp,
      gstPercent,
      finalPrice,
      ...rest
    });

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Duplicate productId' });
    res.status(500).json({ error: err.message });
  }
};


// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Single Product by ID / productId
exports.getProductByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const product = await Product.findOne({ 
      $or: [{ _id: identifier }, { productId: identifier }] 
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { identifier } = req.params;
    const product = await Product.findOne({ 
      $or: [{ _id: identifier }, { productId: identifier }] 
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { identifier } = req.params;
    const deleted = await Product.findOneAndDelete({ 
      $or: [{ _id: identifier }, { productId: identifier }] 
    });
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', product: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change Product Status
exports.changeStatus = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive', 'Discontinued'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const product = await Product.findOne({ 
      $or: [{ _id: identifier }, { productId: identifier }] 
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.status = status;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
