const HealthIssue = require('../models/healthIssuemodel');

// Create
exports.createHealthIssue = async (req, res) => {
  try {
    const newIssue = new HealthIssue(req.body);
    await newIssue.save();
    res.status(201).json(newIssue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Read All
exports.getAllHealthIssues = async (req, res) => {
  try {
    const issues = await HealthIssue.find();
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read One
exports.getHealthIssueById = async (req, res) => {
  try {
    const issue = await HealthIssue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update
exports.updateHealthIssue = async (req, res) => {
  try {
    const updated = await HealthIssue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
exports.deleteHealthIssue = async (req, res) => {
  try {
    const deleted = await HealthIssue.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Health Issues filtered by age
exports.getHealthIssuesByAge = async (req, res) => {
  try {
    const age = parseInt(req.query.age);
    if (isNaN(age)) {
      return res.status(400).json({ message: "Invalid age parameter" });
    }
    const issues = await HealthIssue.find({
      fromAge: { $lte: age },
      toAge: { $gte: age }
    });
    res.status(200).json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};