const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ['Sales', 'Manufacturing'], required: true },
  location: String,
  contactInfo: {
    phone: String,
    email: { type: String, match: /.+\@.+\..+/ },
    address: String
  },
  manager: String,
  isActive: { type: Boolean, default: true },

  // Relations
  assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  activatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Config for product pricing overrides
  config: {
    defaultEnabledProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    pricingOverrides: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        price: Number,
        incentive: Number
      }
    ]
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Branch', BranchSchema);
