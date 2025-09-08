const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    // Reference to the user who owes the fee
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A fee must belong to a user.']
    },

    // Type of fee (e.g., tuition, admission)
    feeType: {
        type: String,
        required: [true, 'Please specify the type of fee.'],
        default: 'Monthly Membership',
    },

    // The total amount that needs to be paid
    amountPayable: {
        type: Number,
        required: [true, 'Please provide the total payable amount.'],
        min: [0, 'Payable amount cannot be negative.'],
        default: 2600
    },

    // The amount that has been paid so far
    amountPaid: {
        type: Number,
        default: 0,
        min: [0, 'Paid amount cannot be negative.']
    },

    // The outstanding balance
    remainingAmount: {
        type: Number,
        min: [0, 'Remaining amount cannot be negative.']
    },

    // The deadline for the payment
    dueDate: {
        type: Date,
        required: [true, 'Please provide a due date.'],
         default: function() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date;}
    },

    // The actual date the payment was completed
    paymentDate: {
        type: Date
    },

    // Current status of the fee payment
    status: {
        type: String,
        enum: ['Paid', 'Partially Paid', 'Pending', 'Overdue'],
        default: 'Pending'
    },

    // Method used for payment
    modeOfPayment: {
        type: String,
        enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']
    },

    // Unique ID from the payment gateway or bank
    transactionId: {
        type: String,
        unique: true,
        sparse: true // This allows multiple documents to have a null value for this field
    },

    // Status from the payment gateway
    transactionStatus: {
        type: String,
        enum: ['Success', 'Failed', 'Pending']
    },

    // Optional notes or description for the fee
    description: {
        type: String,
        trim: true
    },
},
{
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true
});

//-- Mongoose Middleware --//

// Pre-save hook to calculate remainingAmount and update status automatically
feeSchema.pre('save', function(next) {
    // `this` refers to the current document being saved
    this.remainingAmount = this.amountPayable - this.amountPaid;

    // Update status based on payment amounts
    if (this.remainingAmount <= 0) {
        this.status = 'Paid';
        this.remainingAmount = 0; // Ensure remaining amount isn't negative
        if (!this.paymentDate) {
            this.paymentDate = new Date(); // Set payment date on full payment
        }
    } else if (this.amountPaid > 0) {
        this.status = 'Partially Paid';
    } else {
        this.status = 'Pending';
    }

    // Check for overdue status (if not already paid)
    if (this.status !== 'Paid' && new Date() > this.dueDate) {
        this.status = 'Overdue';
    }

    next();
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;