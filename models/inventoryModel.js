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
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  stock: {
    available: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    dispatched: { type: Number, default: 0 },
    current: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now },
  alertsLow: { type: Boolean, default: false },
  alertsExpired: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure unique product-location combination
inventorySchema.index({ location: 1, product: 1 }, { unique: true });

// Always recalc "current" before save
inventorySchema.pre("save", function(next) {
  this.stock.current =
    (this.stock.available || 0) +
    (this.stock.reserved || 0) +
    (this.stock.dispatched || 0);
  this.lastUpdated = new Date();
  next();
});

// -------------------- Transaction Schema --------------------
const transactionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  type: { 
    type: String, 
    enum: ['INWARD', 'OUTWARD', 'ADJUSTMENT', 'ISSUE', 'RESERVE', 'RELEASE', 'OUT'], 
    required: true 
  },
  quantity: { type: Number, required: true },
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
