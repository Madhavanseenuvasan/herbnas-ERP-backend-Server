const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  addFollowUp
} = require('../controllers/leadController');

router.route('/')
  .post(createLead)
  .get(getLeads);

router.route('/:id')
  .put(updateLead)
  .delete(deleteLead);

router.route('/:id/follow-up')
  .post(addFollowUp);

module.exports = router;