const mongoose = require("mongoose");
const { Inventory, InventoryTransaction, Location } = require("../models/inventoryModel");

// -------------------- Helper Functions --------------------

// Reserve stock (for Draft orders)
const reserveStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");
  if (inventory.stock.available < qty) throw new Error("Insufficient stock to reserve");

  inventory.stock.available -= qty;
  inventory.stock.reserved += qty;

  await inventory.save();

  await InventoryTransaction.create({
    product: productId,
    location: locationId,
    type: "RESERVE",
    quantity: qty,
    reference,
    user
  });

  return inventory;
};

// Release reserved stock (Draft order updated/deleted)
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
    user
  });

  return inventory;
};

// Confirm reserved stock → deduct reserved, mark dispatched
const confirmStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");
  if (inventory.stock.reserved < qty) throw new Error("Not enough reserved stock to confirm");

  // Reserved decreases, dispatched increases
  inventory.stock.reserved -= qty;
  inventory.stock.dispatched = (inventory.stock.dispatched || 0) + qty;

  await inventory.save();

  await InventoryTransaction.create({
    product: productId,
    location: locationId,
    type: "OUT",
    quantity: qty,
    reference,
    user
  });

  return inventory;
};

// Restore stock (returns or deleted confirmed orders)
const restoreStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");

  inventory.stock.available += qty;
  if (inventory.stock.dispatched && inventory.stock.dispatched >= qty) {
    inventory.stock.dispatched -= qty;
  } else {
    inventory.stock.dispatched = 0;
  }

  await inventory.save();

  await InventoryTransaction.create({
    product: productId,
    location: locationId,
    type: "INWARD",
    quantity: qty,
    reference,
    user
  });

  return inventory;
};

// -------------------- Inventory Management --------------------

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
      stock: inventory.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adjust stock manually (inward, outward, adjustment, issue)
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
        stock: { current: 0, available: 0, reserved: 0, dispatched: 0 }
      });
    }

    if (type.toUpperCase() === "INWARD") {
      inventory.stock.available += quantity;
      inventory.stock.current = (inventory.stock.available || 0) + (inventory.stock.reserved || 0) + (inventory.stock.dispatched || 0);
    } else if (["OUTWARD", "ISSUE"].includes(type.toUpperCase())) {
      if (inventory.stock.available < quantity) return res.status(400).json({ error: "Insufficient stock" });
      inventory.stock.available -= quantity;
      inventory.stock.current = (inventory.stock.available || 0) + (inventory.stock.reserved || 0) + (inventory.stock.dispatched || 0);
    } else if (type.toUpperCase() === "ADJUSTMENT") {
      inventory.stock.current = quantity;
      inventory.stock.available = quantity;
      inventory.stock.reserved = 0;
      inventory.stock.dispatched = 0;
    }

    await inventory.save();

    await InventoryTransaction.create({
      product: productId,
      location: locationId,
      type: type.toUpperCase(),
      quantity,
      reference,
      notes: reason,
      user
    });

    res.status(200).json({
      message: "Stock adjusted successfully",
      stock: inventory.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Inventory List --------------------
exports.listInventory = async (req, res) => {
  try {
    const { productId, locationId } = req.query;
    const query = {};
    if (productId) query.product = productId;
    if (locationId) query.location = locationId;

    const inventories = await Inventory.find(query)
      .populate("product")
      .populate("location")
      .sort({ updatedAt: -1 });

    const data = inventories.map(inv => {
      const available = inv.stock?.available || 0;
      let status = "In Stock";
      if (available === 0) status = "Out of Stock";
      else if (available < 5) status = "Low Stock";

      return {
        productId: inv.product?._id,
        productName: inv.product?.name,
        sku: inv.product?.sku,
        locationId: inv.location?._id,
        locationName: inv.location?.name,
        stock: inv.stock,
        status,
        lastUpdated: inv.updatedAt
      };
    });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Location Management --------------------
exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find({});
    res.status(200).json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ location });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// -------------------- Export Helpers --------------------
module.exports.reserveStockInternal = reserveStockInternal;
module.exports.releaseStockInternal = releaseStockInternal;
module.exports.confirmStockInternal = confirmStockInternal;
module.exports.restoreStockInternal = restoreStockInternal;
