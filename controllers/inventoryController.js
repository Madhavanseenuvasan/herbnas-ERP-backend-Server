const { InventoryTransaction, InventoryItem } = require("../models/inventoryModel");
const Product = require("../models/productModel");
const Branch = require("../models/branchModel");

// Add to inventory (Product or RawMaterial)
exports.addInventoryItem = async (req, res) => {
  try {
    const { itemType, itemRef, quantity, unit, branch } = req.body;

    // Safeguard: Check existence
    if (itemType === "Product") {
      const product = await Product.findById(itemRef);
      if (!product) return res.status(404).json({ error: "Product not found" });
    } // You should also add RawMaterial model and check here.

    // Find or Create InventoryItem
    let inv = await InventoryItem.findOne({ itemType, itemRef, branch });
    if (!inv) {
      inv = await InventoryItem.create({
        itemType, itemRef, branch, available: quantity, unit
      });
    } else {
      inv.available += quantity;
      await inv.save();
    }

    // Register Transaction
    await InventoryTransaction.create({
      itemType, itemRef, branch, action: "Add", quantity, unit
    });

    res.status(201).json(inv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all inventory for main store or branch
exports.getInventory = async (req, res) => {
  const { branch } = req.query; // branch is ObjectId
  try {
    const q = branch ? { branch } : {};
    const items = await InventoryItem.find(q)
       .populate("itemRef")
       .populate("branch");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Consume Raw Material (deducts stock)
exports.consumeRawMaterial = async (req, res) => {
  try {
    const { itemRef, quantity, unit, branch, relatedProductionBatch, remarks } = req.body;

    // Find InventoryItem
    let inv = await InventoryItem.findOne({ itemType: "RawMaterial", itemRef, branch });
    if (!inv) return res.status(404).json({ error: "Raw Material not found in inventory" });
    if (inv.available < quantity) return res.status(400).json({ error: "Not enough raw material stock" });

    inv.available -= quantity;
    await inv.save();

    // Register Transaction
    await InventoryTransaction.create({
      itemType: "RawMaterial", itemRef, branch, action: "Consume", 
      quantity, unit, relatedProductionBatch, remarks
    });

    res.json(inv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Transfer stock between branches
exports.transferStock = async (req, res) => {
  try {
    const { itemType, itemRef, fromBranch, toBranch, quantity, unit, remarks } = req.body;
    if (!fromBranch || !toBranch) return res.status(400).json({ error: "Both branches required" });

    // Deduct from source
    let fromInv = await InventoryItem.findOne({ itemType, itemRef, branch: fromBranch });
    if (!fromInv || fromInv.available < quantity)
      return res.status(400).json({ error: "Not enough stock at source" });
    fromInv.available -= quantity;
    await fromInv.save();

    // Add to destination
    let toInv = await InventoryItem.findOne({ itemType, itemRef, branch: toBranch });
    if (!toInv) {
      toInv = await InventoryItem.create({ itemType, itemRef, branch: toBranch, available: quantity, unit });
    } else {
      toInv.available += quantity;
      await toInv.save();
    }

    // Register Transactions
    await InventoryTransaction.create([
      {
        itemType, itemRef, branch: fromBranch, action: "TransferOut", quantity, unit, remarks
      },
      {
        itemType, itemRef, branch: toBranch, action: "TransferIn", quantity, unit, remarks
      }
    ]);
    res.json({ from: fromInv, to: toInv });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get inventory transactions log
exports.getTransactions = async (req, res) => {
  const { branch, itemType } = req.query;
  const q = {};
  if (branch) q.branch = branch;
  if (itemType) q.itemType = itemType;
  try {
    const txns = await InventoryTransaction.find(q)
      .populate("itemRef")
      .populate("branch")
      .populate("relatedProductionBatch")
      .sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
