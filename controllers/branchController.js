const Branch = require("../models/branchModel");
const { logAction } = require("../utils/auditLogger");

// Create new branch
exports.createBranch = async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();

    await logAction({
      module: "Branch",
      action: "CREATE",
      entityId: branch._id,
      performedBy: req.user?._id,
      details: { branchCode: branch.branchCode, branchName: branch.branchName }
    });

    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.audit.modifiedBy = req.user?._id || "system";
    branch.audit.modifiedDate = new Date();
    await branch.save();

    await logAction({
      module: "Branch",
      action: "UPDATE",
      entityId: id,
      performedBy: req.user?._id,
      details: req.body
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign user to branch
exports.assignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userAssignment = req.body; // { userId, role, startDate, endDate }

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.userAssignments.push(userAssignment);
    await branch.save();

    await logAction({
      module: "Branch",
      action: "ASSIGN_USER",
      entityId: id,
      performedBy: req.user?._id,
      details: userAssignment
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign product to branch
exports.assignProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productAssignment = req.body; // { productId, priceOverride, discount, validUntil }

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.productAssignments.push(productAssignment);
    await branch.save();

    await logAction({
      module: "Branch",
      action: "ASSIGN_PRODUCT",
      entityId: id,
      performedBy: req.user?._id,
      details: productAssignment
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove product assignment
exports.removeProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.productAssignments = branch.productAssignments.filter(
      (p) => p.productId.toString() !== productId
    );
    await branch.save();

    await logAction({
      module: "Branch",
      action: "REMOVE_PRODUCT",
      entityId: id,
      performedBy: req.user?._id,
      details: { productId }
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single branch
exports.getBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dashboard stats
exports.getBranchDashboard = async (req, res) => {
  try {
    const totalBranches = await Branch.countDocuments();
    const activeBranches = await Branch.countDocuments({ status: "Active" });
    const inactiveBranches = await Branch.countDocuments({ status: "Inactive" });

    const employeesByBranch = await Branch.aggregate([
      { $group: { _id: "$branchName", totalEmployees: { $sum: "$totalEmployees" } } }
    ]);

    res.json({
      totalBranches,
      activeBranches,
      inactiveBranches,
      employeesByBranch
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
