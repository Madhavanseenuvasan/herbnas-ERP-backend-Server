const mongoose = require("mongoose");

const RawMaterialSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  rawMaterialName: { type: String, required: true },
  quantityUsed: { type: Number, required: true },
  unit: { type: String, required: true },
  lotNumber: { type: String } 
}, { _id: false });

const ProductionSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true, trim: true },
  productName: { type: String, required: true, trim: true },
  productionDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  quantityProduced: { type: Number, required: true },
  unit: { type: String, required: true },
  rawMaterials: { type: [RawMaterialSchema], default: [] },
  qualityStatus: {
    type: String,
    enum: ["Pending", "Pass", "Fail", "Hold"],
    default: "Pending"
  },
  remarks: { type: String},
  batchReleased: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Production", ProductionSchema);
