const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");


// ✅ Create a new branch
router.post("/", branchController.createBranch);

// ✅ Update branch details
router.put("/:id", branchController.updateBranch);

// ✅ Get branch details by ID
router.get("/:id",  branchController.getBranch);

// ✅ List all branches
router.get("/", branchController.listBranches);

// ✅ Toggle branch active/inactive
router.patch("/:id/toggle-status",branchController.toggleBranchStatus);

// ✅ Assign a user to a branch
router.post("/assign-user",branchController.assignUser);

// ✅ Remove a user from a branch
router.post("/remove-user",  branchController.removeUser);

// ✅ Activate a product for branch (creates inventory if not exists)
router.post("/activate-product", branchController.activateProduct);

// ✅ Deactivate a product for branch
router.post("/deactivate-product", branchController.deactivateProduct);

// ✅ Branch dashboard (stats)
router.get("/:branchId/dashboard", branchController.getBranchDashboard);

module.exports = router;
