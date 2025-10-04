const express = require('express');
const router = express.Router();
const { createPaymentIntent, stripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;