const Lead = require('../models/leadModel');
const HealthIssue = require('../models/healthIssuemodel');

// helper function: map string → ObjectId
async function mapHealthIssue(reqBody) {
  if (reqBody.healthIssue && typeof reqBody.healthIssue === 'string') {
    const issueDoc = await HealthIssue.findOne({
      healthIssue: { $regex: new RegExp(`^${reqBody.healthIssue}$`, 'i') } // case-insensitive
    });
    if (issueDoc) {
      reqBody.healthIssue = issueDoc._id;
    } else {
      throw new Error(`Health issue "${reqBody.healthIssue}" not found in DB`);
    }
  }
}

// helper function: transform healthIssue object → string
function transformLead(lead) {
  const obj = lead.toObject ? lead.toObject() : lead;

  if (Array.isArray(obj.healthIssue)) {
    obj.healthIssue = obj.healthIssue.map((issue) => issue.healthIssue).join(', ');
  } else if (obj.healthIssue && typeof obj.healthIssue === 'object') {
    obj.healthIssue = obj.healthIssue.healthIssue;
  }

  return obj;
}

// Create Lead
exports.createLead = async (req, res) => {
  try {
    await mapHealthIssue(req.body);

    const leadCount = await Lead.countDocuments();
    const leadId = `Lead${(leadCount + 1).toString().padStart(5, '0')}`;

    const newLead = new Lead({ ...req.body, leadId });
    await newLead.save();

    const populatedLead = await newLead.populate(
      'healthIssue',
      'healthIssue' // only fetch healthIssue string
    );

    res.status(201).json(transformLead(populatedLead));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get Leads (with pagination + healthIssue as string)
exports.getLeads = async (req, res) => {
  try {
    let { page = 1, limit = 10, leadStatus, product, gender, fromDate, toDate, search } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const query = {};

    if (leadStatus) query.leadStatus = leadStatus;
    if (product) query.product = product;
    if (gender) query.gender = gender;

    if (fromDate && toDate) {
      query.createdAt = { $gte: new Date(fromDate), $lte: new Date(toDate) };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } }
      ];
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('healthIssue', 'healthIssue'); // only get the healthIssue field

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      count: leads.length,
      data: leads.map(transformLead) // convert healthIssue → string
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('healthIssue', 'healthIssue');

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    res.json(transformLead(lead));
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
    ).populate('healthIssue', 'healthIssue');

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    res.json(transformLead(lead));
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
