const mongoose = require('mongoose');

const OrderProductSchema = new mongoose.Schema({
  name: { type: String, required: true },   // product name (for UI display)
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // reference if needed
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  gst: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // e.g. ORD-1
  customerName: { type: String, required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  expectedDeliveryDate: { type: Date },
  orderDate: { type: Date, default: Date.now },

  products: [OrderProductSchema],

  subtotal: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  paymentType: { type: String, enum: ['Cash', 'Card', 'UPI', 'COD', 'Online'], required: true },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Partial'], default: 'Unpaid' },

  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Picked', 'Dispatched', 'Delivered', 'Closed', 'Returned'],
    default: 'Draft'
  },

  invoiceUrl: { type: String }, // for download
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
