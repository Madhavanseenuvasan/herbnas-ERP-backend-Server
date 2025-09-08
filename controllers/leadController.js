const Lead = require('../models/leadModel');

// Create Lead
exports.createLead = async (req, res) => {
  try {
    const leadCount = await Lead.countDocuments();
    const leadId = `Lead${(leadCount + 1).toString().padStart(5, '0')}`;
    const newLead = new Lead({ ...req.body, leadId });
    await newLead.save();
    res.status(201).json(newLead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// get leads with filtering and pagination
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }); // get all leads, latest first
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Lead by ID
exports.getLeadById = async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
};

// Update Lead
exports.updateLead = async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
};

// Delete Lead
exports.deleteLead = async (req, res) => {
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ message: 'Lead deleted successfully' });
};