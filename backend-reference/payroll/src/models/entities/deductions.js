const mongoose = require('mongoose');
const { ONE_TIME_DEDUCTION_TYPES } = require('../../utils/oneTimeDeductionTypes');

const deductionsSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    deductionDate: {
        type: Date,
        required: true
    },
    // The label shown on the payslip/profile. For one-time deductions it is the
    // "Deduction for" type below; legacy rows hold whatever free text was typed.
    deductionType: {
        type: String,
        required: true
    },
    // One-time recovery type (utils/oneTimeDeductionTypes.js). Absent on legacy rows.
    deductionFor: {
        type: String,
        enum: ONE_TIME_DEDUCTION_TYPES,
    },
    // Printed next to the deduction on the payslip; required when deductionFor is "Other".
    note: {
        type: String,
        trim: true,
        default: ''
    },
    // The salary month the deduction belongs to (the month selected on Salary Details).
    // Whatever does not fit under the 50% limit that month carries to the next one.
    month: {
        type: Number,
        min: 1,
        max: 12
    },
    year: {
        type: Number
    },
    deductionAmount: {
        type: Number,
        default: 0
    },
    deductionStatus: {
        type: String,
        enum: ['DEDUCTED', 'PENDING'],
        default: 'PENDING'
    }
}, { timestamps: true });

deductionsSchema.index({ corporateUser: 1, employee: 1, year: 1, month: 1 });

deductionsSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
    },
});


const Deductions = mongoose.model('Deductions', deductionsSchema);

module.exports = Deductions;
