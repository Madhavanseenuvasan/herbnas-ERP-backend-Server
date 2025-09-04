const Order = require('../models/orderModel');

// Utility: calculate totals
const calculateTotals = (products, deliveryCharge = 0) => {
  const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const gstAmount = products.reduce((sum, p) => sum + ((p.price * p.quantity) * (p.gst / 100)), 0);
  const grandTotal = subtotal + gstAmount + deliveryCharge;
  return { subtotal, gstAmount, grandTotal };
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { orderId, customerName, branch, expectedDeliveryDate, products, paymentType, deliveryCharge } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one product' });
    }

    const { subtotal, gstAmount, grandTotal } = calculateTotals(products, deliveryCharge || 0);

    const order = new Order({
      orderId,
      customerName,
      branch,
      expectedDeliveryDate,
      products,
      subtotal,
      gstAmount,
      deliveryCharge: deliveryCharge || 0,
      grandTotal,
      paymentType
    });

    await order.save();
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ message: 'Order updated successfully', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('branch products.product');
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
    if (branchId) query.branch = branchId;
    if (status) query.status = status;

    const orders = await Order.find(query).populate('branch products.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
