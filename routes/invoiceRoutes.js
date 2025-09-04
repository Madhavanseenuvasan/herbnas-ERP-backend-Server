const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create new invoice
router.post('/', invoiceController.createInvoice);

// Update invoice
router.put('/:id', invoiceController.updateInvoice);

// Update payment status
router.patch('/:id/payment', invoiceController.updatePaymentStatus);

// Get invoice by ID
router.get('/:id', invoiceController.getInvoice);

// List all invoices
router.get('/', invoiceController.listInvoices);

module.exports = router;
