const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.page) || 1;

  // Build query
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { description: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const category = req.query.category ? { category: req.query.category } : {};
  
  const priceFilter = {};
  if (req.query.minPrice) priceFilter.$gte = Number(req.query.minPrice);
  if (req.query.maxPrice) priceFilter.$lte = Number(req.query.maxPrice);
  
  const query = {
    ...keyword,
    ...category,
    ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
    isActive: true,
  };

  // Get total count
  const count = await Product.countDocuments(query);

  // Get products
  const products = await Product.find(query)
    .populate('category', 'name')
    .populate('seller', 'name email')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name')
    .populate('seller', 'name email');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({
    success: true,
    data: product,
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin/Seller
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, stock, specifications } = req.body;

  // Handle image uploads
  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'products',
        width: 800,
        crop: 'scale',
      });
      
      images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
  }

  // Create product
  const product = await Product.create({
    name,
    description,
    price,
    discountPrice,
    category,
    stock,
    specifications,
    images,
    seller: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin/Seller
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check ownership (seller can only update their own products)
  if (
    req.user.role !== 'admin' &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  // Update fields
  Object.assign(product, req.body);

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    // Delete old images from cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

    // Upload new images
    const images = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'products',
        width: 800,
        crop: 'scale',
      });
      
      images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }
    
    product.images = images;
  }

  await product.save();

  res.json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin/Seller
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check ownership
  if (
    req.user.role !== 'admin' &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  // Delete images from cloudinary
  for (const image of product.images) {
    await cloudinary.uploader.destroy(image.public_id);
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed
  const Review = require('../models/Review');
  const alreadyReviewed = await Review.findOne({
    product: req.params.id,
    user: req.user._id,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Create review
  const review = await Review.create({
    product: req.params.id,
    user: req.user._id,
    rating,
    comment,
  });

  // Update product rating
  const reviews = await Review.find({ product: req.params.id });
  product.numReviews = reviews.length;
  product.rating =
    reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

  await product.save();

  res.status(201).json({
    success: true,
    data: review,
    message: 'Review added successfully',
  });
});