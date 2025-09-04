const Branch = require('../models/branchModel');
const { Inventory } = require('../models/inventoryModel');
const { logAction } = require('../utils/auditLogger');

// ✅ Create new branch
exports.createBranch = async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();

    await logAction({
      module: "Branch",
      action: "CREATE",
      recordId: branch._id,
      performedBy: req.user ? req.user._id : null,
      details: req.body
    });

    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Update existing branch
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndUpdate(id, req.body, { new: true });

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    await logAction({
      module: "Branch",
      action: "UPDATE",
      recordId: id,
      performedBy: req.user ? req.user._id : null,
      details: req.body
    });

    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Assign user to a branch
exports.assignUser = async (req, res) => {
  try {
    const { branchId, userId } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $addToSet: { assignedUsers: userId } },
      { new: true }
    ).populate('assignedUsers');

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    await logAction({
      module: "Branch",
      action: "ASSIGN_USER",
      recordId: branchId,
      performedBy: req.user ? req.user._id : null,
      details: { assignedUserId: userId }
    });

    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Remove user from branch
exports.removeUser = async (req, res) => {
  try {
    const { branchId, userId } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $pull: { assignedUsers: userId } },
      { new: true }
    ).populate('assignedUsers');

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    await logAction({
      module: "Branch",
      action: "REMOVE_USER",
      recordId: branchId,
      performedBy: req.user ? req.user._id : null,
      details: { removedUserId: userId }
    });

    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Activate product for branch + initialize inventory
exports.activateProduct = async (req, res) => {
  try {
    const { branchId, productId } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $addToSet: { activatedProducts: productId } },
      { new: true }
    ).populate('activatedProducts');

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    // Ensure inventory exists
    const inventoryExists = await Inventory.findOne({ branch: branchId, product: productId });
    if (!inventoryExists) {
      await Inventory.create({ branch: branchId, product: productId, quantity: 0 });
    }

    await logAction({
      module: "Branch",
      action: "ACTIVATE_PRODUCT",
      recordId: branchId,
      performedBy: req.user ? req.user._id : null,
      details: { activatedProductId: productId }
    });

    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Deactivate product for branch
exports.deactivateProduct = async (req, res) => {
  try {
    const { branchId, productId } = req.body;

    const branch = await Branch.findByIdAndUpdate(
      branchId,
      { $pull: { activatedProducts: productId } },
      { new: true }
    ).populate('activatedProducts');

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    await logAction({
      module: "Branch",
      action: "DEACTIVATE_PRODUCT",
      recordId: branchId,
      performedBy: req.user ? req.user._id : null,
      details: { deactivatedProductId: productId }
    });

    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Get details of a branch by ID
exports.getBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id)
      .populate('assignedUsers activatedProducts config.defaultEnabledProducts config.pricingOverrides.product');

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ List all branches
exports.listBranches = async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate('assignedUsers activatedProducts')
      .select('name type isActive location manager'); // optimized

    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Toggle branch active/inactive status
exports.toggleBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);

    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    branch.isActive = !branch.isActive;
    await branch.save();

    await logAction({
      module: "Branch",
      action: branch.isActive ? "ACTIVATE" : "DEACTIVATE",
      recordId: id,
      performedBy: req.user ? req.user._id : null
    });

    res.json({ message: `Branch ${branch.isActive ? 'activated' : 'deactivated'}`, branch });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Branch-level dashboard
exports.getBranchDashboard = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId)
      .populate("activatedProducts assignedUsers");

    if (!branch) return res.status(404).json({ error: "Branch not found" });

    // Inventory stats
    const inventoryStats = await Inventory.aggregate([
      { $match: { branch: branch._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          lowStockItems: {
            $sum: { $cond: [{ $lt: ["$quantity", 20] }, 1, 0] }
          },
          totalQuantity: { $sum: "$quantity" }
        }
      }
    ]);

    const stats = inventoryStats[0] || {
      totalProducts: 0,
      lowStockItems: 0,
      totalQuantity: 0
    };

    res.json({
      branch: {
        id: branch._id,
        name: branch.name,
        type: branch.type,
        isActive: branch.isActive,
        users: branch.assignedUsers.length,
        products: branch.activatedProducts.length
      },
      inventory: stats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
