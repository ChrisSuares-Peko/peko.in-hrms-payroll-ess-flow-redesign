const mongoose = require('mongoose');

const schema = new mongoose.Schema(
    {
        corporateUser: { type: String, required: true },
        accountHolderName: { type: String, default: null },
        bankName: { type: String, default: null },
        accountNumber: { type: String, default: null },
        ifscCode: { type: String, default: null },
        accountType: { type: String, enum: ['savings', 'current'], default: 'savings' },
        branch: { type: String, default: null },
        currency: { type: String, default: 'INR' },
        isPrimary: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SalaryRolloutBankAccount', schema);
