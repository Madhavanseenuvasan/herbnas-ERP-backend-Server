const mongoose = require('mongoose');

// Batch sub-schema
const BatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  productionDate: { type: Date, default: Date.now },
  quantityProduced: { type: Number, default: 0 },
  qualityChecked: { type: Boolean, default: false },
  cost: { type: Number, default: 0 },
  yieldPercentage: { type: Number, default: 0 },
  powerConsumption: { type: Number, default: 0 },
  machineryUtilization: { type: Number, default: 0 },
  expiryDate: Date
}, { _id: false });

// Manufacturing spec sub-schema
const ManufacturingSpecSchema = new mongoose.Schema({
  rawMaterial: { type: String, required: true },
  quantity: { type: Number, required: true },
  bookedBy: String,
  bookingDate: { type: Date, default: Date.now }
}, { _id: false });

// Pricing tier sub-schema
const PricingTierSchema = new mongoose.Schema({
  batch: String,
  price: { type: Number, required: true },
  incentive: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  gndpNumber: String,
  csdrNumber: String
}, { _id: false });

// Bill of Materials sub-schema
const BOMSchema = new mongoose.Schema({
  material: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }
}, { _id: false });

// Product schema
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  supplierName: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: String,
  category: String,
  basePrice: { type: Number, default: 0 },
  GST: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 }, // keep if used for quick stock reference
  isActive: { type: Boolean, default: true },
  batches: [BatchSchema],
  pricingTiers: [PricingTierSchema],
  manufacturingSpecs: [ManufacturingSpecSchema],
  billOfMaterials: [BOMSchema]
}, { timestamps: true }); // handles createdAt + updatedAt

module.exports = mongoose.model('Product', ProductSchema);
