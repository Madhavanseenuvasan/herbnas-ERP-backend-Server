const mongoose = require('mongoose');

// Location Schema
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  address: String,
  contactPerson: String,
  contactPhone: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Inventory Movement Schema
const InventoryMovementSchema = new mongoose.Schema({
  movementType: { 
    type: String, 
    enum: ['GRN', 'RETURN', 'FG_RECEIPT', 'SALE', 'ADJUSTMENT'], 
    required: true 
  },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Expired', 'Damaged'], default: 'Active' },
  approved: { type: Boolean, default: true },
  approvedBy: String,
  remarks: String,
  log: String
}, { timestamps: true });

// Inventory Schema
const InventorySchema = new mongoose.Schema({
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: {
    available: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    current: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now },
  alertsLow: { type: Boolean, default: false },
  alertsExpired: { type: Boolean, default: false }
}, { timestamps: true });

InventorySchema.index({ location: 1, product: 1 }, { unique: true });

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['inward', 'outward', 'adjustment', 'issue'], required: true },
  previousQty: Number,
  change: Number,
  resultQty: Number,
  reference: String,
  reason: String,
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  room: String,
  rack: String,
  user: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
const Inventory = mongoose.model('Inventory', InventorySchema);
const InventoryMovement = mongoose.model('InventoryMovement', InventoryMovementSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = {
  Location,
  Inventory,
  InventoryMovement,
  Transaction
};
