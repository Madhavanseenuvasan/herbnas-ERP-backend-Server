const mongoose = require('mongoose');

const ReturnSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true }, // price per unit (after incentives if applicable)
  gst: { type: Number, default: 0 },
  incentive: { type: Number, default: 0 },
  incentiveType: { type: String, default: "-" } // Discount / Bonus / Commission
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phoneNumber:String,
  address:String,
  staffName: { type: String },
  staffIncentive: { type: Number, default: 0 },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  deliveryPartner: { type: String },

  expectedDeliveryDate: { type: Date },
  orderDate: { type: Date, default: Date.now },

  products: { type: [OrderItemSchema], required: true },

  subtotal: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  paymentMode: { type: String, required: true },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Partial'], default: 'Unpaid' },

  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Dispatched', 'Delivered', 'Closed', 'Returned'],
    default: 'Draft'
  },

  returns: [ReturnSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
