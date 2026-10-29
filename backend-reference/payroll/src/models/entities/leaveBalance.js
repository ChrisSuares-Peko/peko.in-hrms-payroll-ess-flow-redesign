const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    leavePolicies: [
        {
            leaveComponent: {  // Reference to the LeaveComponent (leave policy)
                type: mongoose.Schema.Types.ObjectId,
                ref: 'LeaveComponent',
                required: true,
            },
            availableLeave: {
                type: Number,
                required: true,
            },
            carryOverBalance: {
                type: Number,
                default: 0,
            },
             lastCarryoverDate: {
                type: Date, 
                default: null,
            },
          
        }

    ],
}, { timestamps: true });

LeaveBalanceSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

const LeaveBalance = mongoose.model('LeaveBalance', LeaveBalanceSchema);

module.exports = LeaveBalance;
