const express = require('express');
const { body, param, query } = require('express-validator');
const feeController = require('../controllers/feeController');
const { protect: requireAuth } = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

// Apply authentication middleware to all routes in this file
router.use(requireAuth);

// --- Define Routes ---

// GET all fees (admin only) and CREATE a new fee (admin only)
router.route('/')
    .get(
        requireAdmin,
        [
            query('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status must be one of: pending, paid, overdue'),
            query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
            query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        ],
        feeController.getAllFees
    )
    .post(
        requireAdmin,
        [
            body('user').isMongoId().withMessage('A valid user ID is required'),
            body('amount').optional().isNumeric().withMessage('Amount must be a number'),
            body('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status must be one of: pending, paid, overdue')
        ],
        feeController.createFee
    );

// Routes for interacting with a specific fee by its ID
router.route('/:id')
    .get(
        [
            param('id').isMongoId().withMessage('A valid fee ID is required in the URL')
        ],
        feeController.getFeeById
    )
    .patch(
        requireAdmin,
        [
            param('id').isMongoId().withMessage('A valid fee ID is required in the URL'),
            body('amount').optional().isNumeric().withMessage('Amount must be a number'),
            body('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status must be one of: pending, paid, overdue'),
            body('transactionId').optional().isString().trim().notEmpty().withMessage('Transaction ID must be a non-empty string')
        ],
        feeController.updateFee
    )
    .delete(
        requireAdmin,
        [
            param('id').isMongoId().withMessage('A valid fee ID is required in the URL')
        ],
        feeController.deleteFee
    );

module.exports = router;

