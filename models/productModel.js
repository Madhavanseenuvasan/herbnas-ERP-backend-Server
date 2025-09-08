const mongoose = require("mongoose");

// ---------- Batch Schema ----------
const BatchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true },
  lotNo: { type: String, required: true },
  productionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  location: { type: String, required: false },
  quantityProduced: { type: Number, default: 0 },
  totalBatchPrice: { type: Number, default: 0 }
}, { _id: false });

// ---------- Pricing Tier Schema ----------
const PricingSchema = new mongoose.Schema({
  price: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  incentive: { type: Number, default: 0 },
  incentiveType: {
    type: String,
    enum: ["-", "Discount", "Bonus", "Commission"],
    default: "-"
  }
}, { _id: false });

// ---------- Product Schema ----------
const ProductSchema = new mongoose.Schema({
  // Product Info
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  supplier: { type: String, required: true },
  weight: { type: Number, default: 0 },
  description: { type: String, default: "" },

  // Batches
  batches: { type: [BatchSchema], default: [] },

  // Stock
  stock: { type: Number, default: 0 },

  // Pricing as Array (the ONLY change)
  pricing: { type: [PricingSchema], default: [] },

  // Status
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
