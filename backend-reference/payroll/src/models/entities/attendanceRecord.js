const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
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
    date: {
        type: Date,
        required: true
    },
    checkIn: {
        time: Date,
        lat: Number,
        lng: Number,
        method: { type: String, enum: ['ess', 'manual'], default: 'ess' }
    },
    checkOut: {
        time: Date,
        lat: Number,
        lng: Number
    },
    status: {
        type: String,
        enum: ['present', 'late', 'absent', 'on-leave', 'half-day'],
        default: 'absent'
    },
    lateMinutes: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    notes: String,
    createdBy: { type: String, enum: ['ess', 'manual', 'automation'] }
}, { timestamps: true });

attendanceRecordSchema.index({ corporateUser: 1, date: 1 });
attendanceRecordSchema.index({ corporateUser: 1, employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
