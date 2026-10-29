const mongoose = require('mongoose');

const attendanceDisputeSchema = new mongoose.Schema({
    // Corporate scope (corporate credential id, like other payroll records)
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true
    },
    // Employee raising the dispute
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    // Credential id of the USER who raised the dispute
    userId: {
        type: String
    },
    // The disputed attendance record
    attendance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceRecord',
        required: true
    },
    // What is being disputed (snapshot of the attendance status at dispute time)
    disputeType: {
        type: String,
        enum: ['late', 'absent'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    supportingDocs: {  // optional proof; stored as S3 url after upload
        type: String
    },
    status: {
        type: String,
        enum: ['requestedByEmployee', 'approved', 'rejected'],
        default: 'requestedByEmployee'
    },
    remarks: {  // HR/admin decision note
        type: String
    },
    reviewedBy: {
        type: String
    }
}, { timestamps: true });

attendanceDisputeSchema.index({ corporateUser: 1, status: 1 });
attendanceDisputeSchema.index({ employee: 1, createdAt: -1 });

attendanceDisputeSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

module.exports = mongoose.model('AttendanceDispute', attendanceDisputeSchema);
