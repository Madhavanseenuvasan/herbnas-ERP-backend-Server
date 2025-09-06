const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead
} = require('../controllers/leadController');

// Create a new lead
router.post('/', createLead);

//  Get all leads with filtering + pagination
router.get('/', getLeads);

// Get a single lead by ID
router.get('/:id', getLeadById);

//  Update a lead
router.put('/:id', updateLead);

// Delete a lead
router.delete('/:id', deleteLead);

module.exports = router;