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
const { protect, seller } = require('../middleware/authMiddleware');
const { validateZod } = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { productValidator, reviewValidator } = require('../validators/product.validator');

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/:id/reviews', protect, validateZod(reviewValidator), createProductReview);

router.post('/', protect, seller, upload.array('images', 5), validateZod(productValidator), createProduct);
router.put('/:id', protect, seller, upload.array('images', 5), validateZod(productValidator.partial()), updateProduct);
router.delete('/:id', protect, seller, deleteProduct);

module.exports = router;