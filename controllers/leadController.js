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
    const {
      page = 1,
      limit = 10,
      leadStatus,
      product,
      gender,
      fromDate,
      toDate,
      search
    } = req.query;

    const query = {};

    // 🔎 Filtering
    if (leadStatus) query.leadStatus = leadStatus;
    if (product) query.product = product;
    if (gender) query.gender = gender;
    if (search) query.contact = { $regex: search, $options: 'i' };
    if (fromDate && toDate) {
      query.reminder = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    // 📄 Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      leads
    });
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