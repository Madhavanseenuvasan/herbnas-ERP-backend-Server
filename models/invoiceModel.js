const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  type: { type: String, enum: ['Order', 'Service', 'Misc'], required: true },
  invoiceNo: { type: String, required: true, unique: true },
  vendorOrCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Or branch/customer
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // origin branch
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // linked order if applicable

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
      total: Number
    }
  ],

  totalAmount: { type: Number, required: true }, // before tax
  gstAmount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true }, // after tax

  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial', 'Cancelled', 'Returned'],
    default: 'Pending'
  },

  paymentMode: { type: String, enum: ['Prepaid', 'COD', 'Advance'], required: true },
  dueDate: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
