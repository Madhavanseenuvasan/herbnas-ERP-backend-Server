const Payslip = require('../models/payslip');

// CREATE
exports.createPayslip = async (req, res) => {
  try {
    const payslip = new Payslip(req.body); 
    await payslip.save();
    res.status(201).json(payslip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
exports.getPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find();
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
exports.getPayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);
    if (!payslip) return res.status(404).json({ error: 'Not found' });
    res.json(payslip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updatePayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(payslip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.deletePayslip = async (req, res) => {
  try {
    await Payslip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payslip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
