const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  sku: { type: String, unique: true },
  supplier: { type: String },

  // Batch Info
  batchNumber: { type: String },
  expiryDate: { type: Date },

  // Pricing Info
  mrp: { type: Number, required: true }, // MRP / Unit Price
  gstPercent: { type: Number, default: 0 }, // GST %
  stockQuantity: { type: Number, default: 0 },
  incentive: { type: Number, default: 0 }, // incentive per piece
  incentiveType: {
    type: String,
    enum: ["Discount", "Cashback", "Freebie"],
    default: "Discount"
  },

  // Auto tracking
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual fields (not saved in DB)
ProductSchema.virtual("pricePerUnitInclGST").get(function () {
  return this.mrp + (this.mrp * this.gstPercent / 100);
});

ProductSchema.virtual("finalUnitPrice").get(function () {
  let price = this.pricePerUnitInclGST;
  if (this.incentiveType === "Discount") {
    price -= this.incentive;
  }
  return price;
});

ProductSchema.virtual("totalGST").get(function () {
  return (this.mrp * this.gstPercent / 100) * this.stockQuantity;
});

ProductSchema.virtual("totalAmount").get(function () {
  return this.finalUnitPrice * this.stockQuantity;
});

module.exports = mongoose.model("Product", ProductSchema);
