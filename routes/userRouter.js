const express = require('express');
const { body } = require('express-validator');
const {
    registerUser,
    getUsers,
    getUserProfile,
    updateUserProfile
} = require('../controllers/userController');
const {createFee} = require('../controllers/feeController')
const { protect: requireAuth } = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

// Register a new user (public route)
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
        body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required')
    ],
    registerUser,
);

// --- All routes below are protected ---
router.use(requireAuth);

// Get and update the currently logged-in user's profile
router.route('/me')
    .get(getUserProfile)
    .put(
        [
            body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
            body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required')
        ],
        updateUserProfile
    );

// Get a list of all users (admin only)
router.get('/all', requireAdmin, getUsers);

module.exports = router;

