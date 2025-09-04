const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");

// CRUD
router.post("/", branchController.createBranch);
router.put("/:id", branchController.updateBranch);
router.get("/", branchController.getAllBranches);
router.get("/:id", branchController.getBranch);

// Assignments
router.post("/:id/users", branchController.assignUser);
router.post("/:id/products", branchController.assignProduct);
router.delete("/:id/products/:productId", branchController.removeProduct);

// Dashboard
router.get("/dashboard/stats", branchController.getBranchDashboard);

module.exports = router;
