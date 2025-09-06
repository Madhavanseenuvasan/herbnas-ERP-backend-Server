const mongoose = require('mongoose');

// Batch sub-schema
const BatchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true },
  lotNo: { type: String },
  productionDate: { type: Date },
  expiryDate: { type: Date },
  location: { type: String },
  quantityProduced: { type: Number, default: 0 },
  totalBatchPrice: { type: Number, default: 0 }
}, { _id: false });

// Pricing schema
const PricingSchema = new mongoose.Schema({
  price: { type: Number, required: true, default: 0 },   // MRP / Unit Price
  gst: { type: Number, default: 0 },                     // GST %
  incentive: { type: Number, default: 0 },               // Incentive (per piece)
  incentiveType: { type: String, default: "-" }          // e.g. Discount, Cashback
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  supplier: { type: String },
  weight: { type: Number },                              // grams
  description: { type: String },

  pricing: PricingSchema,
  batches: [BatchSchema],

  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
