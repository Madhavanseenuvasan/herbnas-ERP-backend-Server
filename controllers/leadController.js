const Lead = require('../models/leadModel');
const HealthIssue = require('../models/healthIssueModel'); // ✅ fix case-sensitive import

// helper function: map string → ObjectId
async function mapHealthIssue(reqBody) {
  if (reqBody.healthIssue && typeof reqBody.healthIssue === 'string') {
    const issueDoc = await HealthIssue.findOne({
      healthIssue: { $regex: new RegExp(`^${reqBody.healthIssue}$`, 'i') } // case-insensitive match
    });
    if (issueDoc) {
      reqBody.healthIssue = issueDoc._id;
    } else {
      throw new Error(`Health issue "${reqBody.healthIssue}" not found in DB`);
    }
  }
}

// Create Lead
exports.createLead = async (req, res) => {
  try {
    await mapHealthIssue(req.body);

    const leadCount = await Lead.countDocuments();
    const leadId = `Lead${(leadCount + 1).toString().padStart(5, '0')}`;

    const newLead = new Lead({ ...req.body, leadId });
    await newLead.save();

    // populate healthIssue with real fields
    const populatedLead = await newLead.populate(
      'healthIssue',
      'healthIssue gender maritalStatus fromAge toAge'
    );

    res.status(201).json(populatedLead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get Leads
exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .populate('healthIssue', 'healthIssue gender maritalStatus fromAge toAge');

    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('healthIssue', 'healthIssue gender maritalStatus fromAge toAge');

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Lead
exports.updateLead = async (req, res) => {
  try {
    await mapHealthIssue(req.body);

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('healthIssue', 'healthIssue gender maritalStatus fromAge toAge');

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    res.json(lead);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
