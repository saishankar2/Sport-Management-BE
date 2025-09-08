const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Fee = require('../models/Fee');

// Helper function to create JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30m"
  });
};

// Helper function to send token response, used for registration
const sendTokenResponse = (user, statusCode, res) => {
  const token = createToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    expiresIn: "30m",
    data: {
      user
    }
  });
};

exports.registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
        }

        const { email, password, firstName, lastName, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'User with this email already exists' });
        }

        const user = await User.create({ email, password, firstName, lastName, role: role || 'user' });

        // Create the default fee record for the new user
        await Fee.create({user: user._id});

        user.lastLogin = new Date();
        await user.save();

        sendTokenResponse(user, 201, res);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() });
        }

        const { firstName, lastName } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

