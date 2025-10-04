const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateZod } = require('../middleware/validateMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/user.validator');

// User profile routes
router.get('/profile', protect, getUserProfile);
router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  validateZod(updateProfileValidator),
  updateUserProfile
);
router.put(
  '/change-password',
  protect,
  validateZod(changePasswordValidator),
  changePassword
);

// Address management routes
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);

// Admin routes
router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;