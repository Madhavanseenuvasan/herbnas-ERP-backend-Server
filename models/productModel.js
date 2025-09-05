const mongoose = require('mongoose');

// Batch sub-schema
const BatchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true }, 
  lotNo: { type: String },
  productionDate: { type: Date },
  expiryDate: { type: Date },
  location: { type: String },
  quantityProduced: { type: Number, default: 0 },
  totalBatchPrice: { type: Number, default: 0 }  // UI: Total Batch Price
}, { _id: false });

// Pricing schema (per product)
const PricingSchema = new mongoose.Schema({
  price: { type: Number, required: true, default: 0 },          // Price (per piece)
  incentive: { type: Number, default: 0 },                      // Incentive (per piece)
  incentiveType: { type: String, default: "-" },                // Incentive Type
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },                       // Product Name
  sku: { type: String, required: true, unique: true },          // SKU
  pricing: PricingSchema,                                       // Price + Incentives
  batches: [BatchSchema],                                       // Batch details
  stock: { type: Number, default: 0 },                          // Stock (UI column)
  isActive: { type: Boolean, default: true },                   // Active/Inactive
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
