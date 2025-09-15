const express = require('express');
const router = express.Router();
const PayslipController = require('../controllers/payslipController');

router.post('/Payslips', PayslipController.createPayslip);
router.get('/Payslips', PayslipController.getPayslips);
router.get('/Payslips/:id', PayslipController.getPayslip);
router.put('/Payslips/:id', PayslipController.updatePayslip);
router.delete('/Payslips/:id', PayslipController.deletePayslip);

module.exports = router;
