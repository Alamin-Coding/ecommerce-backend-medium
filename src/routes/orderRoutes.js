const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateZod } = require('../middleware/validateMiddleware');
const { createOrderValidator, updateOrderStatusValidator } = require('../validators/order.validator');

router.post('/', protect, validateZod(createOrderValidator), createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/cancel', protect, cancelOrder);

router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, validateZod(updateOrderStatusValidator), updateOrderStatus);

module.exports = router;