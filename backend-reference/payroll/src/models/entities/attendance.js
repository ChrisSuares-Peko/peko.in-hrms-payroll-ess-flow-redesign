const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({

    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true
    },

    employee:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    totalWorkDays:
    {
        type: Number,
        required: true
    },
    lossOfPay:
    {
        type: Number,
        required: true
    },
    totalPayDays:
    {
        type: Number,
        required: true
    },
    month:
    {
        type: Number,
         required: true

    },
    year:
    {
        type: Number,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
