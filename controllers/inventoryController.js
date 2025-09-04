const { Location, Transaction } = require('../models/inventoryModel');
const productModel = require('../models/productModel'); // ensure this file exists

// -------------------- Product Controllers --------------------

// Get all products with filters + pagination
exports.getAllItems = async (req, res) => {
  try {
    const { search, category, brand, minStock, maxStock, page = 1, limit = 10 } = req.query;
    let filter = {};

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    if (minStock || maxStock) {
      filter["stock.current"] = {};
      if (minStock) filter["stock.current"].$gte = Number(minStock);
      if (maxStock) filter["stock.current"].$lte = Number(maxStock);
    }

    const LIMIT = Math.max(1, parseInt(limit) || 10);
    const items = await productModel.find(filter)
      .skip((page - 1) * LIMIT)
      .limit(LIMIT)
      .sort({ createdAt: -1 });

    const total = await productModel.countDocuments(filter);

    res.status(200).json({
      total,
      page: Number(page),
      pages: Math.ceil(total / LIMIT),
      items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single product by ID
exports.getSingleItem = async (req, res) => {
  try {
    const item = await productModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new product
exports.createItem = async (req, res) => {
  try {
    const item = await productModel.create(req.body);
    res.status(201).json({ item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update product
exports.updateItem = async (req, res) => {
  try {
    const item = await productModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: 'Item updated successfully', item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete product
exports.deleteItem = async (req, res) => {
  try {
    const item = await productModel.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: 'Item deleted successfully', item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Stock Management --------------------

// Get stock by product ID
exports.getStockByItemId = async (req, res) => {
  try {
    const item = await productModel.findById(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({
      name: item.name,
      stock: item.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adjust stock (inward, outward, adjustment, issue)
exports.adjustStock = async (req, res) => {
  try {
    const { itemId, type, quantity, reference, reason, location, room, rack, user } = req.body;

    if (!itemId || !type || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const item = await productModel.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const prevQty = item.stock.current;

    if (type === 'inward') {
      item.stock.available += quantity;
      item.stock.current += quantity;
    } else if (type === 'outward') {
      if (item.stock.current < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      item.stock.available -= quantity;
      item.stock.current -= quantity;
    } else if (type === 'adjustment') {
      item.stock.current = quantity;
      item.stock.available = quantity; // ✅ fix: keep available in sync
    } else if (type === 'issue') {
      if (item.stock.current < quantity) {
        return res.status(400).json({ error: 'Insufficient stock for issue' });
      }
      item.stock.available -= quantity;
      item.stock.current -= quantity;
    }

    await item.save();

    await Transaction.create({
      productId: item._id,
      type,
      previousQty: prevQty,
      change: quantity,
      resultQty: item.stock.current,
      reference,
      reason,
      location,
      room,
      rack,
      user,
      date: new Date()
    });

    res.status(200).json({
      message: 'Stock adjusted successfully',
      name: item.name,
      stock: item.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Location Management --------------------

// Get locations
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({});
    res.status(200).json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create location
exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ location });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
