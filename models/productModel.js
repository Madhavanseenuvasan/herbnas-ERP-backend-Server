const mongoose = require('mongoose');

// Batch sub-schema
const BatchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true }, // User batch number
  lotNo: { type: String },
  productionDate: { type: Date },
  expiryDate: { type: Date },
  location: { type: String },
  quantityProduced: { type: Number, default: 0 }
}, { _id: false });

// Pricing tier sub-schema
const PricingTierSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  incentive: { type: Number, default: 0 },
  incentiveType: { type: String, default: "-" }, // e.g. "Bonus", "-"
  tax: { type: Number, default: 0 } // GST%
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  sku: { type: String, required: true, unique: true },
  supplier: String,
  weight: Number,
  description: String,
  isActive: { type: Boolean, default: true },
  batches: [BatchSchema],
  basePrice: { type: Number, default: 0 },      // MRP/Unit Price
  gst: { type: Number, default: 0 },            // GST %
  stock: { type: Number, default: 0 },          // Stock (current total)
  pricing: PricingTierSchema,                   // Latest price/incentive/GST
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
