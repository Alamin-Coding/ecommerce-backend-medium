const asyncHandler = require("express-async-handler");
const Category = require("../models/Category");

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, data: categories });
});

// @desc    Get category by id
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, data: category });
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent } = req.body;
  const category = await Category.create({ name, description, parent });
  res.status(201).json({ success: true, data: category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  category.name = req.body.name || category.name;
  category.description = req.body.description || category.description;
  category.parent =
    req.body.parent !== undefined ? req.body.parent : category.parent;

  await category.save();
  res.json({ success: true, data: category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
});
