const mongoose = require("mongoose");

// ---------- Raw Material Schema ----------
const RawMaterialSchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  materialCode: { type: String, required: true, unique: true },
  category: { type: String },
  subCategory: { type: String },
  supplier: { type: String },
  supplierNumber: { type: String },
  unit: { type: String, required: true }, // kg, gram, bottle, etc.
  description: { type: String },
  price: { type: Number, default: 0 }, // per unit price
  quantity: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 0 },
  gndp: { type: String },
  mrp: { type: Number, default: 0 },
  cpcb: { type: String },
  gst: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ---------- Finished Goods Schema ----------
const FinishedGoodSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productCode: { type: String, required: true, unique: true },
  productPrice: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  perProductPrice: { type: Number, default: 0 },
  perProductMaterial: { type: Number, default: 0 },
  perProductGst: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  materials: [{
    materialName: String,
    unit: String,
    price: Number
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });


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

const RawMaterial = mongoose.model("RawMaterial", RawMaterialSchema);
const FinishedGood = mongoose.model("FinishedGood", FinishedGoodSchema);
const Product = mongoose.model("Product", ProductSchema);

module.exports = { Product, RawMaterial, FinishedGood };
