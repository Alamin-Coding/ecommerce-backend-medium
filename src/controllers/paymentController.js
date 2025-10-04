const asyncHandler = require("express-async-handler");
const stripe = require("../config/stripe");
const Order = require("../models/Order");

// Create payment intent
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  // Ensure stripe client is configured
  if (!stripe) {
    res.status(500);
    throw new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in environment."
    );
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: {
        orderId: orderId,
        userId: req.user._id.toString(),
      },
    });
  } catch (err) {
    // Surface Stripe errors clearly
    res.status(502);
    throw new Error(`Stripe error: ${err.message}`);
  }

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

// Stripe webhook
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    const order = await Order.findById(paymentIntent.metadata.orderId);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentInfo = {
        id: paymentIntent.id,
        status: paymentIntent.status,
      };
      await order.save();
    }
  }

  res.json({ received: true });
});
