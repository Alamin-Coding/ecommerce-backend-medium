const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// Get user profile
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

// Update user profile
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;

  // Handle avatar upload
  if (req.file) {
    if (user.avatar && user.avatar.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      width: 300,
      height: 300,
      crop: 'fill',
    });

    user.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully',
  });
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// Add address
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { street, city, state, zipCode, country, isDefault } = req.body;

  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  user.addresses.push({
    street,
    city,
    state,
    zipCode,
    country,
    isDefault: isDefault || user.addresses.length === 0,
  });

  await user.save();

  res.status(201).json({
    success: true,
    data: user.addresses,
    message: 'Address added successfully',
  });
});

// Update address
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  address.street = req.body.street || address.street;
  address.city = req.body.city || address.city;
  address.state = req.body.state || address.state;
  address.zipCode = req.body.zipCode || address.zipCode;
  address.country = req.body.country || address.country;

  if (req.body.isDefault && !address.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
    address.isDefault = true;
  }

  await user.save();

  res.json({
    success: true,
    data: user.addresses,
    message: 'Address updated successfully',
  });
});

// Delete address
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  address.deleteOne();

  if (address.isDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.json({
    success: true,
    data: user.addresses,
    message: 'Address deleted successfully',
  });
});

// Get all users (Admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { email: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const count = await User.countDocuments(keyword);

  const users = await User.find(keyword)
    .select('-password')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// Get user by ID (Admin)
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

// Update user (Admin)
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully',
  });
});

// Delete user (Admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.avatar && user.avatar.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});