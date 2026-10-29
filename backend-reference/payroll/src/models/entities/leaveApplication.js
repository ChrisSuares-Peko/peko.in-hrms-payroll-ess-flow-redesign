const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    typeOfLeave: {  // Link to the LeaveComponent model — omitted when isUnpaidLeave is true
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaveComponent',
        required: false
    },

    start: {  // Start date of the leave
        type: Date,
        required: true
    },
    end: {  // End date of the leave
        type: Date,
        required: true
    },
    leaveCount: {  // Number of days the employee is requesting
        type: Number,
        required: true
    },
    halfDaySelection:{
        type:String,
        required:false
    },
    // Auto-created 0.5-day cut from the Late Arrival Policy (ESS check-in) —
    // excluded from the normal leave list, shown only in the Deduction Log.
    isLateArrivalDeduction: {
        type: Boolean,
        default: false
    },
    // Auto-created 1-day cut when an absence is first materialized into a real record
    // (e.g. the employee disputes it) — excluded from the normal leave list, shown only
    // in the Deduction Log.
    isAbsentDeduction: {
        type: Boolean,
        default: false
    },
    // Unpaid leave isn't backed by a configurable LeaveComponent 
    // which always treats it as a special, uncapped leave type).
    isUnpaidLeave: {
        type: Boolean,
        default: false
    },
    // ESS request lifecycle. Left undefined for HR-created records
    status: {
        type: String,
        enum: ['applied', 'approved', 'rejected', 'cancelledByEmployee']
    },
    // Employee's reason (ESS) or HR's decision note (on approve/reject).
    notes: {
        type: String
    }
}, { timestamps: true });

leaveApplicationSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);
module.exports = LeaveApplication;
