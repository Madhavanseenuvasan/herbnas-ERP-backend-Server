const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    // ---------- Step 1: Product Info ----------
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    supplier: { type: String, required: true },
    weight: { type: Number, required: false },
    description: { type: String, required: false },

    // ---------- Step 2: Batch Info ----------
    batchNo: { type: String, required: true },
    lotNo: { type: String, required: true },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    location: { type: String, required: false },

    // ---------- Step 3: Pricing ----------
    price: { type: Number, required: true }, // MRP / Unit Price
    gst: { type: Number, default: 0 },       // GST %
    stockQuantity: { type: Number, required: true },

    // Incentives
    incentive: { type: Number, default: 0 },
    incentiveType: { type: String, enum: ["Discount", "Cashback"], default: "Discount" },

    // Status
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
