const mongoose = require("mongoose");

// Transaction schema
const InventoryTransactionSchema = new mongoose.Schema({
  itemType: { type: String, enum: ["Product", "RawMaterial"], required: true },
  itemRef: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "itemType" },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  action: { 
    type: String, 
    enum: ["Add", "Consume", "TransferIn", "TransferOut", "Adjustment"], 
    required: true 
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  relatedProductionBatch: { type: mongoose.Schema.Types.ObjectId, ref: "Production" },
  remarks: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const InventoryItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ["Product", "RawMaterial"], required: true },
  itemRef: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "itemType" },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  available: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true }
}, { timestamps: true });

module.exports = {
  InventoryTransaction: mongoose.model("InventoryTransaction", InventoryTransactionSchema),
  InventoryItem: mongoose.model("InventoryItem", InventoryItemSchema)
};
