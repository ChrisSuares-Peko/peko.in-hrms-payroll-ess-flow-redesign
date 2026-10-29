const mongoose = require('mongoose');

const corporateUserProgressSchema = new mongoose.Schema(
    {
        corporateUser: {
            type: String,
            ref: 'CorporateUser',
            required: true,
            unique: true
        },
        progress: { type: Number, default: 0 },
        hasCompanyProfile: { type: Boolean, default: false },
        hasPayrollSettings: { type: Boolean, default: false },
        hasSalaryComponent: { type: Boolean, default: false },
        hasDeductionComponents: { type: Boolean, default: false },
        hasBasicSalaryComponent: { type: Boolean, default: false },
        basicSalaryAmount: { type: Number, default: 0 },
        onBoardStatus: { type: Number, default: 0 },
        isSkippedDasboard: { type: Boolean, default: false },
        numberOfDaysWorking: { type: Number, default: 0 },
        // Set once default leave policies have been seeded, so deleting them all doesn't re-seed
        hasSeededDefaultLeaves: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const CorporateUserProgress = mongoose.model('CorporateUserProgress', corporateUserProgressSchema);

module.exports = CorporateUserProgress;
