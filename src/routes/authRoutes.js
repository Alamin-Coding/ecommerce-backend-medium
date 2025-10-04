const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateZod } = require('../middleware/validateMiddleware');
const { registerValidator, loginValidator } = require('../validators/user.validator');

router.post('/register', validateZod(registerValidator), register);
router.post('/login', validateZod(loginValidator), login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;