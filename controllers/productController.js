const Product = require('../models/productModel');
const { InventoryItem } = require('../models/inventoryModel');

// -------------------- Create Product --------------------
exports.createProduct = async (req, res) => {
  try {
    const { productId, productName, mrp, gstPercent, ...rest } = req.body;

    if (!productId || !productName || mrp === undefined || gstPercent === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalPrice = +(mrp * (1 + gstPercent / 100)).toFixed(2);

    // Create Product
    const product = await Product.create({
      productId,
      productName,
      mrp,
      gstPercent,
      finalPrice,
      ...rest
    });

    // Also create in Inventory
    await InventoryItem.create({
      productId,
      productName,
      mrp,
      gstPercent,
      finalPrice,
      ...rest
    });

    // Populate productName (fetch actual name)
    const populatedProduct = await Product.findById(product._id)
      .populate('productName', 'productName')
      .lean();

    const formatted = {
      ...populatedProduct,
      productName: populatedProduct.productName?.productName || null
    };

    res.status(201).json(formatted);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'Duplicate productId' });
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Get All Products --------------------
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('productName', 'productName')
      .lean();

    const formatted = products.map(p => ({
      ...p,
      productName: p.productName?.productName || null
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Get Single Product --------------------
exports.getProductByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;
    const product = await Product.findOne({
      $or: [{ _id: identifier }, { productId: identifier }]
    })
      .populate('productName', 'productName')
      .lean();

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const formatted = {
      ...product,
      productName: product.productName?.productName || null
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Update Product --------------------
exports.updateProduct = async (req, res) => {
  try {
    const { identifier } = req.params;
    const product = await Product.findOne({
      $or: [{ _id: identifier }, { productId: identifier }]
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    Object.assign(product, req.body);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('productName', 'productName')
      .lean();

    const formatted = {
      ...populatedProduct,
      productName: populatedProduct.productName?.productName || null
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Delete Product --------------------
exports.deleteProduct = async (req, res) => {
  try {
    const { identifier } = req.params;
    const deleted = await Product.findOneAndDelete({
      $or: [{ _id: identifier }, { productId: identifier }]
    })
      .populate('productName', 'productName')
      .lean();

    if (!deleted) return res.status(404).json({ error: 'Product not found' });

    const formatted = {
      ...deleted,
      productName: deleted.productName?.productName || null
    };

    res.json({ message: 'Product deleted', product: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Change Product Status --------------------
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

    const populatedProduct = await Product.findById(product._id)
      .populate('productName', 'productName')
      .lean();

    const formatted = {
      ...populatedProduct,
      productName: populatedProduct.productName?.productName || null
    };

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
