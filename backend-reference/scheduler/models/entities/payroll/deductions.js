const mongoose = require('mongoose');

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
    deductionType: {
        type: String,
        required: true
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
