const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  originBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  destinationBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // cross-branch
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  orderType: { type: String, enum: ['Internal', 'Staff'], required: true },
  paymentMode: { type: String, enum: ['Prepaid', 'COD', 'Advance'], required: true },
  staffPlacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Picked', 'Dispatched', 'Delivered', 'Closed', 'Returned'],
    default: 'Draft'
  },

  staffIncentive: { type: Number, default: 0 },

  approval: {
    approved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalDate: Date
  },

  returnInfo: {
    isReturned: { type: Boolean, default: false },
    reason: String,
    adjustedStock: { type: Boolean, default: false },
    adjustedPayment: { type: Boolean, default: false }
  },

  billing: {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
    amount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }
  },

  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
