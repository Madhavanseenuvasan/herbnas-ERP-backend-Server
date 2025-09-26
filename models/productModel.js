// models/productModel.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, trim: true }, 
  productName: { type: mongoose.Schema.Types.ObjectId, ref:"Production" ,req:true},
  category: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  hsnGstCode: { type: String, trim: true, default: '' },
  unitOfMeasure: { type: String, trim: true, default: '' },
  batchSizeStandard: { type: String, default: '' }, 
  mrp: { type: Number, required: true, min: 0 },
  gstPercent: { type: Number, required: true, min: 0 },
  finalPrice: { type: Number, required: true, min: 0 },
  expiryDate: { type: Date },
  regulatoryApproval: { type: String, default: '' },
  packagingInfo: { type: String, default: '' },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active'
  }
}, { timestamps: true });

ProductSchema.virtual('priceWithGst').get(function () {
  if (typeof this.mrp !== 'number' || typeof this.gstPercent !== 'number') return null;
  return +(this.mrp * (1 + this.gstPercent / 100)).toFixed(2);
});

module.exports = mongoose.model('Product', ProductSchema);
