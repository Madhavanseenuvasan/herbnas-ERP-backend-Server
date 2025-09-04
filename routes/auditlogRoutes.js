const express = require("express");
const AuditLog = require("../models/auditlogModel");
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('user').sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
