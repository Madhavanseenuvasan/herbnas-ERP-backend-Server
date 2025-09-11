const mongoose = require('mongoose');

// const followUpSchema = new mongoose.Schema({
//   date: Date,
//   notes: String,
//   contactedBy: String
// });

//followUps: [followUpSchema],

const leadSchema = new mongoose.Schema({
  leadId: { type: String, unique: true },
  contact: { type: String, required: true },
  leadStatus: { type: String, enum: ['New', 'Dispatched', 'Order Completed', 'Qualified', 'Pending'], default: 'New' },
  product: { type: String, required: true },
  healthIssue: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'HealthIssue'
},
  reminder: { type: Date },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  dispatchedFrom: { type: String },
  product: { type: String, required: true },
  notes: { type: String }, // ✅ Add this line
  address: {
    city: String,
    pinCode: String,
    state: String,
    country: String
  },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);