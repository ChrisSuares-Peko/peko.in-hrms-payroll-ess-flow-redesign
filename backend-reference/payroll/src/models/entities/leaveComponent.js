const mongoose = require('mongoose');

const leaveComponentSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    leaveType: {
        type: String,
        required: true
    },
    accrualType: {
        type: String,
        enum: ['FIXED', 'MONTHLY', 'DAILY','YEARLY'],
        default: 'FIXED', // Default accrual type
        required: true
    },
    accrualRate: {
        type: String,
        default: null
    },
    maximumAccrual: {
        type: String,
        default: null
    },
    leaveBalanceCarryover: {
        type: String,
        enum: ['ALLOWED', 'NOT_ALLOWED'],
        required: true
    },
    maximumNumberOfLeaves: {
        type: Number,
        required: true
    },
    isGlobal: {
        type: Boolean,
        default: true
    },
    carryOverBalance: {  // Store the carried-over leaves for the next year
        type: Number,
        default: 0
    },
    globalComponentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaveComponent',
        default: null // Will be populated when an employee-specific component is created from a global component
    },
    applicableGender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'ALL'],
        default: 'ALL'
    }
}, { timestamps: true });

leaveComponentSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

const LeaveComponent = mongoose.model('LeaveComponent', leaveComponentSchema);
module.exports = LeaveComponent;
