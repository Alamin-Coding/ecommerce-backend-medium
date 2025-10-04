const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} = require('../controllers/productController');
const { protect, admin, seller } = require('../middleware/authMiddleware');
const { validateZod } = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  productValidator,
  reviewValidator,
} = require('../validators/product.validator');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes
router.post('/:id/reviews', protect, validateZod(reviewValidator), createProductReview);

// Admin/Seller routes
router.post(
  '/',
  protect,
  seller,
  upload.array('images', 5),
  validateZod(productValidator),
  createProduct
);

router.put(
  '/:id',
  protect,
  seller,
  upload.array('images', 5),
  validateZod(productValidator.partial()),
  updateProduct
);

router.delete('/:id', protect, seller, deleteProduct);

module.exports = router;