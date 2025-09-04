const Order = require('../models/orderModel');
const { Inventory, InventoryMovement } = require('../models/inventoryModel');
const Invoice = require('../models/invoiceModel');
const { logAction } = require('../utils/auditLogger');
const User = require('../models/userModel'); // ensure User ref works

// Utility to calculate totals
const calculateTotals = (products) => {
  const totalAmount = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const gstAmount = totalAmount * 0.18; // Example: 18% GST
  const netAmount = totalAmount + gstAmount;
  return { totalAmount, gstAmount, netAmount };
};

// Place new order
exports.createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();

    // Handle stock only if PICKED (avoid double deduction)
    if (order.status === 'Picked') {
      for (const item of order.products) {
        const inventory = await Inventory.findOne({ branch: order.originBranch, product: item.product });
        if (!inventory) return res.status(400).json({ error: `No inventory found for product ${item.product}` });
        if (inventory.quantity < item.quantity) return res.status(400).json({ error: `Insufficient stock for product ${item.product}` });

        inventory.quantity -= item.quantity;
        inventory.lastUpdated = new Date();
        await inventory.save();

        await InventoryMovement.create({
          movementType: 'SALE',
          branch: order.originBranch,
          product: item.product,
          quantity: item.quantity,
          remarks: `Order placed - ${order._id}`
        });
      }
    }

    // Auto-generate invoice if confirmed or dispatched
    if (['Confirmed', 'Dispatched'].includes(order.status)) {
      const { totalAmount, gstAmount, netAmount } = calculateTotals(order.products);

      const invoice = await Invoice.create({
        type: "Order",
        invoiceNo: `INV-${Date.now()}`,
        order: order._id,
        branch: order.originBranch,
        vendorOrCustomer: order.staffPlacedBy || order.originBranch,
        items: order.products.map(p => ({
          product: p.product,
          quantity: p.quantity,
          price: p.price
        })),
        totalAmount,
        gstAmount,
        netAmount,
        status: order.paymentMode === "Prepaid" ? "Paid" : "Unpaid",
        category: "Order Billing",
        date: new Date(),
        paymentMode: order.paymentMode
      });

      order.billing = {
        invoiceId: invoice._id,
        paymentStatus: invoice.status,
        amount: totalAmount,
        tax: gstAmount,
        totalAmount: netAmount
      };

      await order.save();
    }

    await logAction({ module: 'Order', action: 'CREATE', entityId: order._id, performedBy: req.user?._id, details: req.body });
    res.status(201).json(order);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approval } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status || order.status;

    // Handle approval updates
    if (approval) {
      order.approval = { ...order.approval, ...approval, approvalDate: new Date() };
    }

    // Deduct stock only once (when PICKED)
    if (status === 'Picked' && !order.stockDeducted) {
      for (const item of order.products) {
        const inventory = await Inventory.findOne({ branch: order.originBranch, product: item.product });
        if (!inventory || inventory.quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for product ${item.product}` });
        }

        inventory.quantity -= item.quantity;
        await inventory.save();

        await InventoryMovement.create({
          movementType: 'SALE',
          branch: order.originBranch,
          product: item.product,
          quantity: item.quantity,
          remarks: `Order picked - ${order._id}`
        });
      }
      order.stockDeducted = true; // flag to prevent double deduction
    }

    // Generate invoice if confirmed/dispatched and no invoice exists
    if (['Confirmed', 'Dispatched'].includes(status) && !order.billing?.invoiceId) {
      const { totalAmount, gstAmount, netAmount } = calculateTotals(order.products);

      const invoice = await Invoice.create({
        type: "Order",
        invoiceNo: `INV-${Date.now()}`,
        order: order._id,
        branch: order.originBranch,
        vendorOrCustomer: order.staffPlacedBy || order.originBranch,
        items: order.products.map(p => ({
          product: p.product,
          quantity: p.quantity,
          price: p.price
        })),
        totalAmount,
        gstAmount,
        netAmount,
        status: order.paymentMode === "Prepaid" ? "Paid" : "Unpaid",
        category: "Order Billing",
        date: new Date(),
        paymentMode: order.paymentMode
      });

      order.billing = {
        invoiceId: invoice._id,
        paymentStatus: invoice.status,
        amount: totalAmount,
        tax: gstAmount,
        totalAmount: netAmount
      };
    }

    await order.save();
    await logAction({ module: 'Order', action: 'STATUS_UPDATE', entityId: order._id, performedBy: req.user?._id, details: { status, approval } });
    res.json(order);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Process return
exports.processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, adjustedStock, adjustedPayment } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'Returned';
    order.returnInfo = { isReturned: true, reason, adjustedStock, adjustedPayment };

    // Restore stock
    if (adjustedStock) {
      for (const item of order.products) {
        const inventory = await Inventory.findOne({ branch: order.originBranch, product: item.product });
        if (inventory) {
          inventory.quantity += item.quantity;
          await inventory.save();

          await InventoryMovement.create({
            movementType: 'RETURN',
            branch: order.originBranch,
            product: item.product,
            quantity: item.quantity,
            remarks: `Order return - ${order._id}`
          });
        }
      }
    }

    // Adjust billing
    if (adjustedPayment && order.billing?.invoiceId) {
      const invoice = await Invoice.findById(order.billing.invoiceId);
      if (invoice) {
        invoice.status = "Returned";
        await invoice.save();
        order.billing.paymentStatus = "Returned";
      }
    }

    await order.save();
    await logAction({ module: 'Order', action: 'RETURN', entityId: order._id, performedBy: req.user?._id, details: { reason, adjustedStock, adjustedPayment } });
    res.json(order);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get order details
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('originBranch destinationBranch products.product staffPlacedBy approval.approvedBy billing.invoiceId');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List orders
exports.listOrders = async (req, res) => {
  try {
    const { branchId, status } = req.query;
    const query = {};
    if (branchId) query.originBranch = branchId;
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('originBranch destinationBranch products.product billing.invoiceId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
