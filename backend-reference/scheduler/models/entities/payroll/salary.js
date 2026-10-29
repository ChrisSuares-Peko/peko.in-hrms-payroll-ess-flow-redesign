const mongoose = require('mongoose');
const salaryInformationSchema = require('./salaryInformationSchema');


const salarySchema = new mongoose.Schema({
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
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    salaryCycleStart: {
        type: Date,
        required: true
    },
    salaryCycleEnd: {
        type: Date,
        required: true
    },
    salaryCycleDays: {
        type: Number,
        default: 0
    },
    leaveCount: {
        type: Number,
        default: 0
    },
    leaveDeduction: {
        type: Number,
        default: 0
    },
    attendancePercentage: {
        type: Number,
        default: 0
    },


    otherDeductions: [{
        type: mongoose.Schema.Types.ObjectId, //keeping for record
        ref: 'Deductions'
    }],
    totalOtherDeduction: {
        type: Number,
        default: 0
    },

    incentives: [{
        type: mongoose.Schema.Types.ObjectId, //keeping for record
        ref: 'Incentives'
    }],
    totalIncentive: {
        type: Number,
        default: 0
    },
    bonus: [{
        type: mongoose.Schema.Types.ObjectId, //keeping for record
        ref: 'Bonus'
    }],
    totalBonus: {
        type: Number,
        default: 0
    },
    overtime: [{
        type: mongoose.Schema.Types.ObjectId, //keeping for record
        ref: 'Overtime'
    }],
    totalOvertime: {
        type: Number,
        default: 0
    },
    

    totalPayable: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        required: true
    },
    paySlipEmailSent: {
        type: Boolean,
        default: false
    },
    message: String,
    paymentStatus: {
        type: String,
        enum: ['PAID', 'PENDING', 'FAILD', 'N/A', 'UPCOMING'],
        default: 'PENDING' //on salary processing it will be pending...UPCOMING-> for current month's till cycle day
    },
    salaryInformation: salaryInformationSchema, //saves employee current month salary data from employee collection-- for history purpose


}, { timestamps: true });

salarySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;
