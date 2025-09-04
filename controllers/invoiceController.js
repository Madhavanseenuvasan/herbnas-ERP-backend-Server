const Invoice = require('../models/invoiceModel');
const { logAction } = require('../utils/auditLogger');

// Create Invoice
exports.createInvoice = async (req, res) => {
  try {
    const data = req.body;

    // auto generate invoice no
    data.invoiceNo = `INV-${Date.now()}`;

    const invoice = new Invoice(data);
    await invoice.save();

    await logAction({
      module: "Invoice",
      action: "CREATE",
      entityId: invoice._id,
      performedBy: req.user ? req.user._id : null,
      details: data
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    req.body.updatedAt = new Date();

    const invoice = await Invoice.findByIdAndUpdate(id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    await logAction({
      module: "Invoice",
      action: "UPDATE",
      entityId: id,
      performedBy: req.user ? req.user._id : null,
      details: req.body
    });

    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mark invoice as Paid / Partial
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    await logAction({
      module: "Invoice",
      action: "PAYMENT_STATUS",
      entityId: id,
      performedBy: req.user ? req.user._id : null,
      details: { status }
    });

    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Invoice by ID
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).populate("order items.product vendorOrCustomer branch");

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all invoices
exports.listInvoices = async (req, res) => {
  try {
    const { branchId, status } = req.query;
    const query = {};
    if (branchId) query.branch = branchId;
    if (status) query.status = status;

    const invoices = await Invoice.find(query).populate("order branch items.product vendorOrCustomer");
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
