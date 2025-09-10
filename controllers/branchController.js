const Branch = require("../models/branchModel");
const { logAction } = require("../utils/auditLogger");

// -------------------- Create Branch --------------------
exports.createBranch = async (req, res) => {
  try {
    const branch = new Branch({
      ...req.body,
      audit: {
        createdBy: req.user?._id?.toString() || "system",
        createdDate: new Date(),
      },
    });

    await branch.save();

    await logAction({
      module: "Branch",
      action: "CREATE",
      entityId: branch._id,
      performedBy: req.user?._id,
      details: { branchCode: branch.branchCode, branchName: branch.branchName },
    });

    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// -------------------- Update Branch --------------------
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    // Partial update
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        branch[key] = req.body[key];
      }
    });

    branch.audit.modifiedBy = req.user?._id?.toString() || "system";
    branch.audit.modifiedDate = new Date();
    await branch.save();

    await logAction({
      module: "Branch",
      action: "UPDATE",
      entityId: id,
      performedBy: req.user?._id,
      details: req.body,
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Assign User --------------------
exports.assignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role, startDate, endDate } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: "userId and role are required" });
    }

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.userAssignments.push({ userId, role, startDate, endDate });
    await branch.save();

    await logAction({
      module: "Branch",
      action: "ASSIGN_USER",
      entityId: id,
      performedBy: req.user?._id,
      details: req.body,
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Assign Product --------------------
exports.assignProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, priceOverride, discount, effectiveFrom, effectiveTo } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.productAssignments.push({
      productId,
      priceOverride,
      discount,
      effectiveFrom,
      effectiveTo
    });

    await branch.save();

    await logAction({
      module: "Branch",
      action: "ASSIGN_PRODUCT",
      entityId: id,
      performedBy: req.user?._id,
      details: req.body,
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Remove Product --------------------
exports.removeProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    branch.productAssignments = branch.productAssignments.filter(
      (p) => p.productId !== productId
    );

    await branch.save();

    await logAction({
      module: "Branch",
      action: "REMOVE_PRODUCT",
      entityId: id,
      performedBy: req.user?._id,
      details: { productId },
    });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Delete Branch (Soft Delete) --------------------
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ error: "Branch not found" });

    // Capture details before deletion for logging
    const branchDetails = {
      branchCode: branch.branchCode,
      branchName: branch.branchName,
    };

    // Hard delete
    await Branch.findByIdAndDelete(id);

    // Audit logging
    await logAction({
      module: "Branch",
      action: "DELETE",
      entityId: id,
      performedBy: req.user?._id,
      details: branchDetails,
    });

    res.json({ message: "Branch deleted permanently", branch: branchDetails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// -------------------- Get All Branches --------------------
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------- Get Single Branch --------------------
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

// -------------------- Branch Dashboard --------------------
exports.getBranchDashboard = async (req, res) => {
  try {
    const totalBranches = await Branch.countDocuments();
    const activeBranches = await Branch.countDocuments({ status: "ACTIVE" });
    const inactiveBranches = await Branch.countDocuments({ status: "INACTIVE" });

    const employeesByBranch = await Branch.aggregate([
      {
        $group: {
          _id: "$_id",
          branchName: { $first: "$branchName" },
          totalEmployees: { $sum: "$totalEmployees" },
        },
      },
    ]);

    res.json({
      totalBranches,
      activeBranches,
      inactiveBranches,
      employeesByBranch,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
