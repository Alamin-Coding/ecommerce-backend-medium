const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Review = require('../models/Review');
const cloudinary = require('../config/cloudinary');

// Get all products
exports.getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.page) || 1;

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

  const count = await Product.countDocuments(query);

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

// Get product by ID
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

// Create product
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, stock, specifications } = req.body;

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

// Update product
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (
    req.user.role !== 'admin' &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  Object.assign(product, req.body);

  if (req.files && req.files.length > 0) {
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }

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

// Delete product
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (
    req.user.role !== 'admin' &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  for (const image of product.images) {
    await cloudinary.uploader.destroy(image.public_id);
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// Create product review
exports.createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = await Review.findOne({
    product: req.params.id,
    user: req.user._id,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    product: req.params.id,
    user: req.user._id,
    rating,
    comment,
  });

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