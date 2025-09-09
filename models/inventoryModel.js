const mongoose = require('mongoose');

// -------------------- Location Schema --------------------
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  address: String,
  contactPerson: String,
  contactPhone: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// -------------------- Inventory Schema --------------------
const inventorySchema = new mongoose.Schema({
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

inventorySchema.index({ location: 1, product: 1 }, { unique: true });

// -------------------- Transaction Schema --------------------
const transactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  type: { 
    type: String, 
    enum: ['INWARD', 'OUTWARD', 'ADJUSTMENT', 'ISSUE', 'RESERVE', 'RELEASE', 'OUT'], 
    required: true 
  },
  quantity: Number,
  reference: String,
  notes: String,
  user: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const InventoryTransaction = mongoose.model('InventoryTransaction', transactionSchema);

module.exports = {
  Location,
  Inventory,
  InventoryTransaction
};
