const Product = require("../models/productModel");
const { logAction } = require("../utils/auditLogger");

// Get all products (no filters, full list)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Add new product
exports.addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    await logAction({
      module: "Product",
      action: "CREATE",
      entityId: product._id,
      performedBy: req.user?._id,
      details: { name: product.name, sku: product.sku }
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit product
exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
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

// Deactivate product
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

// Activate product
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

// Set pricing tiers
exports.setPricingTiers = async (req, res) => {
  try {
    const { id } = req.params;
    const { pricingTiers } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      { pricingTiers },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: "Product",
      action: "SET_PRICING",
      entityId: id,
      performedBy: req.user?._id,
      details: { pricingTiers }
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add manufacturing spec
exports.addManufacturingSpec = async (req, res) => {
  try {
    const { id } = req.params;
    const { manufacturingSpec } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.manufacturingSpecs.push(manufacturingSpec);
    await product.save();

    await logAction({
      module: "Product",
      action: "ADD_MANUFACTURING_SPEC",
      entityId: id,
      performedBy: req.user?._id,
      details: { manufacturingSpec }
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Set BOM
exports.setBOM = async (req, res) => {
  try {
    const { id } = req.params;
    const { billOfMaterials } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      { billOfMaterials },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "Product not found" });

    await logAction({
      module: "Product",
      action: "SET_BOM",
      entityId: id,
      performedBy: req.user?._id,
      details: { billOfMaterials }
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add batch
exports.addBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const batchData = req.body || {};

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Auto-generate batchId if missing
    batchData.batchId = batchData.batchId || `BATCH-${Date.now()}`;

    product.batches.push(batchData);
    await product.save();
    
    await logAction({
      module: "Product",
      action: "ADD_BATCH",
      entityId: id,
      performedBy: req.user?._id,
      details: batchData
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get product list
exports.getProductList = async (req, res) => {
  try {
    const { search = "", limit = 20, skip = 0 } = req.query;
    const query = { isActive: true };

    if (search) query.name = { $regex: search, $options: "i" };

    const products = await Product.find(query)
      .skip(Number(skip))
      .limit(Number(limit))
      .select("name sku category basePrice quantity");

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get product by ID
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

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expiringBatchesCount = await Product.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$batches" },
      {
        $match: {
          "batches.expiryDate": {
            $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }
    ]).then(r => r.length);

    res.json({
      totalProducts: await Product.countDocuments({ isActive: true }),
      lowStockItems: await Product.countDocuments({
        isActive: true,
        quantity: { $lt: 20 }
      }),
      expiringBatches: expiringBatchesCount,
      monthlySales: 0 // Placeholder until Sales schema integration
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
