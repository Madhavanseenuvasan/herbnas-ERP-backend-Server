const express = require('express');
const router = express.Router();
const healthIssueController = require('../controllers/healthIssue.controller');

router.post('/health-issues', healthIssueController.createHealthIssue);
router.get('/health-issues', healthIssueController.getAllHealthIssues);
router.get('/health-issues/by-age', healthIssueController.getHealthIssuesByAge);
router.get('/health-issues/:id', healthIssueController.getHealthIssueById);
router.put('/health-issues/:id', healthIssueController.updateHealthIssue);
router.delete('/health-issues/:id', healthIssueController.deleteHealthIssue);



module.exports = router;
