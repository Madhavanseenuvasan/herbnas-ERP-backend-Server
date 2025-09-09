const { Inventory, InventoryTransaction, Location } = require("../models/inventoryModel");

// -------------------- Stock Management --------------------

// Get stock by product & location
exports.getStockByItemId = async (req, res) => {
  try {
    const { productId, locationId } = req.params;
    const inventory = await Inventory.findOne({ product: productId, location: locationId })
      .populate("product")
      .populate("location");

    if (!inventory) return res.status(404).json({ error: "No stock found for this product/location" });

    res.status(200).json({
      product: inventory.product.name,
      location: inventory.location.name,
      stock: inventory.stock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adjust stock (inward, outward, adjustment, issue)
exports.adjustStock = async (req, res) => {
  try {
    const { productId, type, quantity, reference, reason, locationId, user } = req.body;

    if (!productId || !type || typeof quantity !== "number" || !locationId) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    let inventory = await Inventory.findOne({ product: productId, location: locationId });
    if (!inventory) {
      inventory = await Inventory.create({
        product: productId,
        location: locationId,
        stock: { current: 0, available: 0, reserved: 0 },
      });
    }

    if (type.toUpperCase() === "INWARD") {
      inventory.stock.current += quantity;
      inventory.stock.available += quantity;
    } else if (["OUTWARD", "ISSUE"].includes(type.toUpperCase())) {
      if (inventory.stock.available < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      inventory.stock.current -= quantity;
      inventory.stock.available -= quantity;
    } else if (type.toUpperCase() === "ADJUSTMENT") {
      inventory.stock.current = quantity;
      inventory.stock.available = quantity;
    }

    await inventory.save();

    await InventoryTransaction.create({
      product: productId,
      location: locationId,
      type: type.toUpperCase(),
      quantity,
      reference,
      notes: reason,
      user,
    });

    res.status(200).json({
      message: "Stock adjusted successfully",
      stock: inventory.stock,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Reservation Flow --------------------

// Internal function
const reserveStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");
  if (inventory.stock.available < qty) throw new Error("Insufficient stock");

  inventory.stock.available -= qty;
  inventory.stock.reserved += qty;
  await inventory.save();

  await InventoryTransaction.create({
    product: productId,
    location: locationId,
    type: "RESERVE",
    quantity: qty,
    reference,
    user,
  });

  return inventory;
};

// API wrapper
exports.reserveStock = async (req, res) => {
  try {
    const { productId, locationId, qty, reference, user } = req.body;
    const inventory = await reserveStockInternal(productId, locationId, qty, reference, user);
    res.status(200).json({ message: "Stock reserved", stock: inventory.stock });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Internal function
const releaseStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");

  inventory.stock.reserved -= qty;
  inventory.stock.available += qty;
  await inventory.save();

  await InventoryTransaction.create({
    product: productId,
    location: locationId,
    type: "RELEASE",
    quantity: qty,
    reference,
    user,
  });

  return inventory;
};

// API wrapper
exports.releaseStock = async (req, res) => {
  try {
    const { productId, locationId, qty, reference, user } = req.body;
    const inventory = await releaseStockInternal(productId, locationId, qty, reference, user);
    res.status(200).json({ message: "Stock released", stock: inventory.stock });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Internal function
const deductStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");

  if (inventory.stock.reserved < qty) throw new Error("Not enough reserved stock");

  inventory.stock.reserved -= qty;
  inventory.stock.current -= qty;
  await inventory.save();

  await InventoryTransaction.create({
    product: productId,
    location: locationId,
    type: "OUT",
    quantity: qty,
    reference,
    user,
  });

  return inventory;
};

// API wrapper
exports.deductStock = async (req, res) => {
  try {
    const { productId, locationId, qty, reference, user } = req.body;
    const inventory = await deductStockInternal(productId, locationId, qty, reference, user);
    res.status(200).json({ message: "Stock deducted", stock: inventory.stock });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
