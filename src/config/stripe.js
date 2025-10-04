const Stripe = require("stripe");

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  // Export a dummy object that will throw clear errors if used without config
  console.warn(
    "Warning: STRIPE_SECRET_KEY is not set. Stripe features will not work."
  );
  module.exports = null;
} else {
  const stripe = new Stripe(stripeSecret, { apiVersion: "2022-11-15" });
  module.exports = stripe;
}
