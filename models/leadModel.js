const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  date: Date,
  notes: String,
  contactedBy: String
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  source: { type: String, default: 'manual' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new'
  },
  branch: String,
  owner: String,
  followUps: [followUpSchema],
  performanceScore: { type: Number, default: 0 },
  reminderDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);