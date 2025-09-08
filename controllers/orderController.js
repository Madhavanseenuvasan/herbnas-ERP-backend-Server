const Order = require("../models/orderModel");
const Product = require("../models/productModel");

// ---------- Helper: calculate totals ----------
const calculateTotals = (items) => {
  let subtotal = 0, gstAmount = 0;
  for (const p of items) {
    let finalPrice = p.price;
    if (p.incentiveType === "Discount") finalPrice -= p.incentive;
    subtotal += finalPrice * p.qty;
    gstAmount += (finalPrice * p.qty) * (p.gst / 100);
  }
  const grandTotal = subtotal + gstAmount;
  return { subtotal, gstAmount, grandTotal };
};

// ---------- Helper: format order for frontend ----------
const formatOrderResponse = (order) => {
  const formattedDate = new Date(order.orderDate).toISOString().split("T")[0];
  const formattedTime = new Date(order.orderDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return {
    orderId: order.orderId,
    staffName: order.staffName,
    customerName: order.customerName,
    incentive: order.staffIncentive || 0,
    deliveryPartner: order.deliveryPartner,
    paymentMode: order.paymentMode,
    branch: order.branch,
    expectedDeliveryDate: order.expectedDeliveryDate,
    orderDate: formattedDate,
    orderTime: formattedTime,
    status: order.status,
    products: order.products,
    subtotal: order.subtotal,
    totalGST: order.gstAmount,
    totalAmount: order.grandTotal,
    itemsCount: order.products.length,
    totalItems: order.products.reduce((sum, p) => sum + p.qty, 0)
  };
};

// ---------- Generate Incremental OrderId ----------
const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  let nextNumber = 1001;
  if (lastOrder && lastOrder.orderId) {
    const lastNumber = parseInt(lastOrder.orderId.split("-")[1], 10);
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }
  return `ORD-${nextNumber}`;
};

// ---------- Create Order ----------
exports.createOrder = async (req, res) => {
  try {
    const { customerName, staffName, staffIncentive, branch, deliveryPartner,
            expectedDeliveryDate, products, paymentMode, status } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: "Order must have at least one product" });
    }

    let orderItems = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });
      if (product.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

      // Deduct stock
      product.stock -= item.qty;
      await product.save();

      const { price, gst, incentive, incentiveType } = product.pricing[0] || {};

      orderItems.push({
        productId: product._id,
        name: product.name,
        qty: item.qty,
        price,
        gst,
        incentive,
        incentiveType
      });
    }

    const { subtotal, gstAmount, grandTotal } = calculateTotals(orderItems);

    const order = new Order({
      orderId: await generateOrderId(),
      customerName,
      staffName,
      staffIncentive,
      branch,
      deliveryPartner,
      expectedDeliveryDate,
      products: orderItems,
      subtotal,
      gstAmount,
      grandTotal,
      paymentMode,
      status
    });

    await order.save();
    res.status(201).json({ message: "Order created successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Update Order ----------
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { products, ...rest } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // If products updated
    if (products && products.length > 0) {
      // Restore old stock
      for (const oldItem of order.products) {
        const prod = await Product.findById(oldItem.productId);
        if (prod) {
          prod.stock += oldItem.qty;
          await prod.save();
        }
      }

      // Deduct stock for new items
      let newOrderItems = [];
      for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });
        if (product.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });

        product.stock -= item.qty;
        await product.save();

        const { price, gst, incentive, incentiveType } = product.pricing[0] || {};
        newOrderItems.push({ productId: product._id, name: product.name, qty: item.qty, price, gst, incentive, incentiveType });
      }

      order.products = newOrderItems;
      const totals = calculateTotals(newOrderItems);
      order.subtotal = totals.subtotal;
      order.gstAmount = totals.gstAmount;
      order.grandTotal = totals.grandTotal;
    }

    Object.assign(order, rest);
    await order.save();

    res.json({ message: "Order updated successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Process Return ----------
exports.processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    order.status = "Returned";
    order.returns.push({ reason });
    await order.save();

    res.json({ message: "Return processed successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Update only status/payment ----------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ message: "Order status updated successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Get single order ----------
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(formatOrderResponse(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- List all orders ----------
exports.listOrders = async (req, res) => {
  try {
    const { branch, status } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (status) query.status = status;

    const orders = await Order.find(query);
    res.json(orders.map(formatOrderResponse));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Delete Order ----------
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Restore stock
    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }

    await Order.findByIdAndDelete(id);

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
