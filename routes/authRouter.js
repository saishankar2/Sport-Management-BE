const express = require('express');
const { body } = require('express-validator');
const {
  login,
  logout,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/logout', protect, logout);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  changePassword
);

module.exports = router;

