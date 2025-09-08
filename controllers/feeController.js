const Fee = require('../models/Fee.js'); // Assuming fee.js is in the parent directory

// --- Controller Functions ---

// 1. CREATE a new fee
exports.createFee = async (req, res) => {
    try {
        const newFee = await Fee.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                fee: newFee
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// 2. READ all fees
exports.getAllFees = async (req, res) => {
    try {
        const fees = await Fee.find();
        res.status(200).json({
            status: 'success',
            results: fees.length,
            data: {
                fees
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching documents: ' + error.message
        });
    }
};

// 3. READ a single fee by ID
exports.getFeeById = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) {
            return res.status(404).json({
                status: 'fail',
                message: 'No fee found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                fee
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching document: ' + error.message
        });
    }
};

// 4. UPDATE a fee by ID
exports.updateFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true // Rerun schema validators
        });

        if (!fee) {
            return res.status(404).json({
                status: 'fail',
                message: 'No fee found with that ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                fee
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// 5. DELETE a fee by ID
exports.deleteFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndDelete(req.params.id);

        if (!fee) {
            return res.status(404).json({
                status: 'fail',
                message: 'No fee found with that ID'
            });
        }

        // 204 means "No Content", a standard response for successful deletions
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting document: ' + error.message
        });
    }
};

