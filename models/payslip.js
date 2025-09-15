const mongoose = require('mongoose');

const PayslipSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  month: String,
  year: Number,
  netSalary: Number,
  basicSalaryAmount: Number,
  incentives: Number,
  otPay: Number,
  proRated: Number,
  department: String,
  jobPosition: String,
  generatedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Unpaid' }
});

module.exports = mongoose.model('Payslip', PayslipSchema);
