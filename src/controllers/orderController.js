const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');

// Create order
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Verify products and update stock
  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    product.stock -= item.quantity;
    await product.save();
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Order Confirmation',
      message: `Your order #${order._id} has been placed successfully. Total: ${totalPrice}`,
    });
  } catch (error) {
    console.log('Email sending failed:', error.message);
  }

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created successfully',
  });
});

// Get order by ID
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price images');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({
    success: true,
    data: order,
  });
});

// Get user orders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  const count = await Order.countDocuments({ user: req.user._id });

  const orders = await Order.find({ user: req.user._id })
    .populate('orderItems.product', 'name images')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// Get all orders (Admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  const status = req.query.status ? { orderStatus: req.query.status } : {};

  const count = await Order.countDocuments(status);

  const orders = await Order.find(status)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// Update order to paid
exports.updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentInfo = {
    id: req.body.id,
    status: req.body.status,
    updateTime: req.body.update_time,
  };

  const updatedOrder = await order.save();

  res.json({
    success: true,
    data: updatedOrder,
    message: 'Order marked as paid',
  });
});

// Update order status (Admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = status;

  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }

  const updatedOrder = await order.save();

  const user = await require('../models/User').findById(order.user);
  try {
    await sendEmail({
      email: user.email,
      subject: 'Order Status Update',
      message: `Your order #${order._id} status: ${status}`,
    });
  } catch (error) {
    console.log('Email sending failed:', error.message);
  }

  res.json({
    success: true,
    data: updatedOrder,
    message: 'Order status updated successfully',
  });
});

// Cancel order
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  if (!['pending', 'processing'].includes(order.orderStatus)) {
    res.status(400);
    throw new Error('Cannot cancel order at this stage');
  }

  // Restore stock
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save();
    }
  }

  order.orderStatus = 'cancelled';
  await order.save();

  res.json({
    success: true,
    data: order,
    message: 'Order cancelled successfully',
  });
});