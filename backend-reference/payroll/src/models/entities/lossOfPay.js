const mongoose = require('mongoose');

// One row per employee per payroll month, written from the Loss of Pay sheet (Payroll ›
// Salary). LOP is unpaid days, not a deduction: processEmpSalary scales every earning by
// the paid share of the month (see getEmployeeSalaryComponentForProcessSalary), so PF/ESI/
// TDS follow the reduced pay. Zero days deletes the row instead of storing it.
const lossOfPaySchema = new mongoose.Schema({
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
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    // Half-day steps.
    days: {
        type: Number,
        required: true,
        min: 0
    },
    // Rupee value taken off the month's pay. Derived from days × per-day rate unless HR typed
    // over it (isAmountOverridden), in which case the typed figure drives the paid share.
    amount: {
        type: Number,
        default: 0,
        min: 0
    },
    isAmountOverridden: {
        type: Boolean,
        default: false
    },
    updatedBy: {
        type: String
    }
}, { timestamps: true });

lossOfPaySchema.index({ corporateUser: 1, employee: 1, year: 1, month: 1 }, { unique: true });
lossOfPaySchema.index({ corporateUser: 1, year: 1, month: 1 });

lossOfPaySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

const LossOfPay = mongoose.model('LossOfPay', lossOfPaySchema, 'lossOfPay');

module.exports = LossOfPay;
