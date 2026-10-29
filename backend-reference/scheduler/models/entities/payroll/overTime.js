const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
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
    overTimeDate: {
        type: Date,
        required: true
    },
    totalWorkingHours: {
        type: Number,
        required: true
    },
    extraHours: {
        type: Number,
        default: 0
    },
    hourlyRate:{
        type: Number,
        required: true
    },
    overTimeAmount: {
        type: Number,
        default: 0
    },
    overTimeRate: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'UNPAID'],
        default: 'UNPAID'
    }
}, { timestamps: true });

overtimeSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Overtime = mongoose.model('Overtime', overtimeSchema);

module.exports = Overtime;
