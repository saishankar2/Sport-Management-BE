const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect: requireAuth } = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);


router.get('/get-users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users',
      error: error.message
    });
  }
});

module.exports = router;