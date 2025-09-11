const mongoose = require("mongoose");
const { Inventory, InventoryTransaction, Location } = require("../models/inventoryModel");

// -------------------- Helper Functions --------------------

// Reserve stock (Draft orders)
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

// Release reserved stock
const releaseStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");

  inventory.stock.reserved -= qty;
  if (inventory.stock.reserved < 0) inventory.stock.reserved = 0;
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

// Confirm reserved stock → dispatch
const confirmStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");
  if (inventory.stock.reserved < qty) throw new Error("Not enough reserved stock to confirm");

  inventory.stock.reserved -= qty;
  inventory.stock.dispatched += qty;

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

// Restore stock (returns / cancelled confirmed orders)
const restoreStockInternal = async (productId, locationId, qty, reference, user) => {
  const inventory = await Inventory.findOne({ product: productId, location: locationId });
  if (!inventory) throw new Error("Inventory record not found");

  inventory.stock.available += qty;
  if (inventory.stock.dispatched >= qty) {
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

// -------------------- Controllers --------------------

// Get stock by product & location (with product + batch details)
exports.getStockByItemId = async (req, res) => {
  try {
    const { productId, locationId } = req.params;
    const inventory = await Inventory.findOne({ product: productId, location: locationId })
      .populate("product")
      .populate("location");

    if (!inventory) return res.status(404).json({ error: "No stock found for this product/location" });

    const product = inventory.product;

    res.status(200).json({
      product: {
        id: product._id,
        name: product.name,
        category: product.category,
        supplier: product.supplier,
        gstRate: product.gstRate,
        price: product.price,
        batches: product.batches?.map(b => ({
          batchNo: b.batchNo,
          productionDate: b.productionDate,
          expiryDate: b.expiryDate,
          qty: b.qty
        }))
      },
      location: inventory.location.name,
      stock: inventory.stock
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adjust stock manually
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
        stock: { available: 0, reserved: 0, dispatched: 0 }
      });
    }

    switch (type.toUpperCase()) {
      case "INWARD":
        inventory.stock.available += quantity;
        break;
      case "OUTWARD":
      case "ISSUE":
        if (inventory.stock.available < quantity) return res.status(400).json({ error: "Insufficient stock" });
        inventory.stock.available -= quantity;
        break;
      case "ADJUSTMENT":
        inventory.stock.available = quantity;
        inventory.stock.reserved = 0;
        inventory.stock.dispatched = 0;
        break;
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

// List inventory (with product + batch + pricing info, without IDs)
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

      const product = inv.product;
      const pricing = product?.pricing?.[0] || { price: 0, gst: 0 };

      return {
        inventoryId: inv._id,   
        productName: product?.name,
        sku: product?.sku,
        category: product?.category,
        supplier: product?.supplier,
        price: pricing.price,
        gstRate: pricing.gst,
        batches: product?.batches?.map(b => ({
          batchNo: b.batchNo,
          lotNo: b.lotNo,
          productionDate: b.productionDate,
          expiryDate: b.expiryDate,
        })),
        locationName: inv.location?.name,
        stock: {
          available: inv.stock?.available || 0,
          reserved: inv.stock?.reserved || 0,
          dispatched: inv.stock?.dispatched || 0,
          current:
            (inv.stock?.available || 0) +
            (inv.stock?.reserved || 0) +
            (inv.stock?.dispatched || 0)
        },
        status,
        lastUpdated: inv.updatedAt
      };
    });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Edit inventory
exports.editInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const updates = req.body;

    const inventory = await Inventory.findByIdAndUpdate(inventoryId, updates, { new: true })
      .populate("product")
      .populate("location");

    if (!inventory) return res.status(404).json({ error: "Inventory record not found" });

    res.status(200).json({ message: "Inventory updated", inventory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete inventory
exports.deleteInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const inventory = await Inventory.findByIdAndDelete(inventoryId);

    if (!inventory) return res.status(404).json({ error: "Inventory record not found" });

    res.status(200).json({ message: "Inventory deleted successfully" });
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

// -------------------- Location Update --------------------
exports.updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const updateData = req.body;

    const location = await Location.findByIdAndUpdate(locationId, updateData, {
      new: true,
      runValidators: true
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(200).json({ message: "Location updated successfully", location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Location Delete --------------------
exports.deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    const location = await Location.findByIdAndDelete(locationId);

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(200).json({ message: "Location deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------- Export helpers --------------------
module.exports.reserveStockInternal = reserveStockInternal;
module.exports.releaseStockInternal = releaseStockInternal;
module.exports.confirmStockInternal = confirmStockInternal;
module.exports.restoreStockInternal = restoreStockInternal;
