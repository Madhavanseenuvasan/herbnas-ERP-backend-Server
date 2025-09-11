const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const { Inventory, InventoryTransaction } = require("../models/inventoryModel");

// Import stock helpers
const {
  reserveStockInternal,
  releaseStockInternal,
  confirmStockInternal,
  restoreStockInternal
} = require("../controllers/inventoryController"); // <-- adjust path

// ---------- Helper: calculate totals ----------
const calculateTotals = (items) => {
  let subtotal = 0, gstAmount = 0;
  for (const p of items) {
    let finalPrice = p.price;
    if (p.incentiveType === "Discount") finalPrice -= p.incentive || 0;
    subtotal += (finalPrice || 0) * (p.qty || 0);
    gstAmount += ((finalPrice || 0) * (p.qty || 0)) * ((p.gst || 0) / 100);
  }
  const grandTotal = subtotal + gstAmount;
  return { subtotal, gstAmount, grandTotal };
};

// ---------- Helper: format order for frontend ----------
const formatOrderResponse = (order) => {
  const formattedDate = order.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : null;
  const formattedTime = order.orderDate ? new Date(order.orderDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
  return {
    orderId: order.orderId,
    staffName: order.staffName,
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    address: order.address,
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
    itemsCount: order.products?.length || 0,
    totalItems: (order.products || []).reduce((sum, p) => sum + (p.qty || 0), 0)
  };
};

// ---------- Helper: Generate Incremental OrderId ----------
const generateOrderId = async () => {
  const lastOrder = await Order.findOne().sort({ createdAt: -1 });
  let nextNumber = 1001;
  if (lastOrder && lastOrder.orderId) {
    const parts = lastOrder.orderId.split("-");
    const lastNumber = parseInt(parts[1], 10);
    if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }
  return `ORD-${nextNumber}`;
};

// ---------- Create Order ----------
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName, phoneNumber, address, staffName, staffIncentive,
      branch, deliveryPartner, expectedDeliveryDate, products,
      paymentMode, status
    } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ error: "Order must have at least one product" });
    }

    const orderItems = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });

      // Reserve stock instead of deducting directly
      await reserveStockInternal(product._id, branch, item.qty, "Order creation", staffName);

      const { price, gst, incentive, incentiveType } = product.pricing?.[0] || {};
      orderItems.push({
        productId: product._id,
        name: product.name,
        qty: item.qty,
        price: price || 0,
        gst: gst || 0,
        incentive: incentive || 0,
        incentiveType: incentiveType || "-"
      });
    }

    const { subtotal, gstAmount, grandTotal } = calculateTotals(orderItems);

    const order = new Order({
      orderId: await generateOrderId(),
      customerName,
      phoneNumber,
      address,
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
      status: status || "Draft" // Default: Draft = Reserved
    });

    await order.save();

    res.status(201).json({ message: "Order created successfully (stock reserved)", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Update Order ----------
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: "orderId is required in params" });

    const { products, ...rest } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Only handle stock changes if still in Draft (reservation stage)
    if (Array.isArray(products) && products.length > 0) {
      if (order.status !== "Draft") {
        return res.status(400).json({ error: "Products can only be updated while order is in Draft" });
      }

      // Release previously reserved stock
      for (const oldItem of order.products) {
        await releaseStockInternal(
          oldItem.productId,
          order.branch,
          oldItem.qty,
          `Order ${orderId} product update (release old qty)`,
          order.staffName
        );
      }

      // Reserve new stock
      const newOrderItems = [];
      for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product) return res.status(404).json({ error: `Product not found: ${item.productId}` });

        await reserveStockInternal(
          product._id,
          order.branch,
          item.qty,
          `Order ${orderId} product update (reserve new qty)`,
          rest.staffName || order.staffName
        );

        const { price, gst, incentive, incentiveType } = product.pricing?.[0] || {};
        newOrderItems.push({
          productId: product._id,
          name: product.name,
          qty: item.qty,
          price: price || 0,
          gst: gst || 0,
          incentive: incentive || 0,
          incentiveType: incentiveType || "-"
        });
      }

      order.products = newOrderItems;
      const totals = calculateTotals(newOrderItems);
      order.subtotal = totals.subtotal;
      order.gstAmount = totals.gstAmount;
      order.grandTotal = totals.grandTotal;
    }

    // Update other allowed fields
    delete rest.orderId;
    delete rest.createdAt;
    delete rest._id;
    Object.keys(rest).forEach(key => {
      if (rest[key] !== undefined) order[key] = rest[key];
    });

    await order.save();
    res.json({ message: "Order updated successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Process Return ----------
exports.processReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required in params" });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Restore stock properly
    for (const item of order.products) {
      await restoreStockInternal(
        item.productId,
        order.branch,
        item.qty,
        `Order ${orderId} return`,
        order.staffName
      );
    }

    order.status = "Returned";
    order.returns = order.returns || [];
    order.returns.push({ reason, date: new Date() });
    await order.save();

    res.json({ message: "Return processed successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------- Delete Order ----------
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ error: "orderId is required in params" });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Release reserved or restore stock
    if (order.status === "Draft") {
      for (const item of order.products) {
        await releaseStockInternal(
          item.productId,
          order.branch,
          item.qty,
          `Order ${orderId} deleted (release reserved)`,
          order.staffName
        );
      }
    } else {
      for (const item of order.products) {
        await restoreStockInternal(
          item.productId,
          order.branch,
          item.qty,
          `Order ${orderId} deleted (restore)`,
          order.staffName
        );
      }
    }

    await Order.deleteOne({ orderId });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------- Get single order ----------
exports.getOrder = async (req, res) => {
  try {
    const { id, orderId } = req.params;
    let order;
    if (orderId) order = await Order.findOne({ orderId });
    else if (id) order = await Order.findById(id);
    else return res.status(400).json({ error: "id or orderId required in params" });

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

// ---------- Update only status/payment ----------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const { status, paymentStatus } = req.body;

    let order;
    if (orderId) order = await Order.findOne({ orderId });
    else if (id) order = await Order.findById(id);
    else return res.status(400).json({ error: "id or orderId is required in params" });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Handle Draft → Confirmed (convert reserved → deducted)
    if (status && status === "Confirmed" && order.status === "Draft") {
      for (const item of order.products) {
        await confirmStockInternal(
          item.productId,
          order.branch,
          item.qty,
          `Order ${order.orderId} confirmed`,
          order.staffName
        );
      }
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({ message: "Order status updated successfully", order: formatOrderResponse(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
