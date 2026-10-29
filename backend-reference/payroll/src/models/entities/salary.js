// const mongoose = require('mongoose');
// const salaryInformationSchema = require('./salaryInformationSchema');


// const salarySchema = new mongoose.Schema({
//     corporateUser: {
//         type: String,
//         ref: 'CorporateUser',
//         required: true,
//     },
//     employee: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee1',
//         required: true
//     },
//     year: {
//         type: Number,
//         required: true
//     },
//     month: {
//         type: Number,
//         required: true
//     },
//     salaryCycleStart: {
//         type: Date,
//         required: true
//     },
//     salaryCycleEnd: {
//         type: Date,
//         required: true
//     },
//     salaryCycleDays: {
//         type: Number,
//         default: 0
//     },
//     leaveCount: {
//         type: Number,
//         default: 0
//     },
//     leaveDeduction: {
//         type: Number,
//         default: 0
//     },
//     attendancePercentage: {
//         type: Number,
//         default: 0
//     },


//     otherDeductions: [{
//         type: mongoose.Schema.Types.ObjectId, //keeping for record
//         ref: 'Deductions'
//     }],
//     totalOtherDeduction: {
//         type: Number,
//         default: 0
//     },

//     incentives: [{
//         type: mongoose.Schema.Types.ObjectId, //keeping for record
//         ref: 'Incentives'
//     }],
//     totalIncentive: {
//         type: Number,
//         default: 0
//     },
//     bonus: [{
//         type: mongoose.Schema.Types.ObjectId, //keeping for record
//         ref: 'Bonus'
//     }],
//     totalBonus: {
//         type: Number,
//         default: 0
//     },
//     overtime: [{
//         type: mongoose.Schema.Types.ObjectId, //keeping for record
//         ref: 'Overtime'
//     }],
//     totalOvertime: {
//         type: Number,
//         default: 0
//     },


//     totalPayable: {
//         type: Number,
//         default: 0
//     },
//     status: {
//         type: Boolean,
//         required: true
//     },
//     paySlipEmailSent: {
//         type: Boolean,
//         default: false
//     },
//     message: String,
//     paymentStatus: {
//         type: String,
//         enum: ['PAID', 'PENDING', 'FAILD', 'N/A', 'UPCOMING', 'APPROVED'],
//         default: 'PENDING' //on salary processing it will be pending...UPCOMING-> for current month's till cycle day
//     },
//     payingDate: {
//         type: Date
//     },
//     salaryInformation: salaryInformationSchema, //saves employee current month salary data from employee collection-- for history purpose


// }, { timestamps: true });

// salarySchema.set('toJSON', {
//     transform: function (doc, ret) {
//         ret.id = ret._id;
//         delete ret._id;
//         delete ret.__v;
//     },
// });


// const Salary = mongoose.model('Salary', salarySchema);

// module.exports = Salary;

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

    reimbursements: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reimbursement'
    }],
    totalReimbursement: {
        type: Number,
        default: 0
    },

    arrears: [{
        type: mongoose.Schema.Types.ObjectId, //keeping for record
        ref: 'Arrears'
    }],
    totalArrears: {
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
        enum: ['PAID', 'PENDING', 'FAILD', 'N/A', 'UPCOMING', 'APPROVED', 'INITIATED'],
        default: 'PENDING'
    },
    payingDate: {
        type: Date
    },
    paidViaRollout: {
        type: Boolean,
        default: false
    },
    salaryInformation: salaryInformationSchema, //saves employee current month salary data from employee collection-- for history purpose
    // Loss of Pay applied to this month (from the LOP sheet). Not a deduction — the
    // earnings in salaryInformation are already the reduced, paid figures; grossBeforeLop
    // is the full month's gross the per-day rate is worked from.
    lossOfPay: {
        days: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        isAmountOverridden: { type: Boolean, default: false },
        grossBeforeLop: { type: Number, default: 0 },
    },
    // One-time recoveries (Add Deduction) applied this month, after PF/ESI/TDS and within
    // the 50% limit — totalOtherDeduction is their sum. `outstanding` is what was still owed
    // when this month ran; anything above `appliedAmount` carries to the next month.
    oneTimeDeductions: [{
        _id: false,
        deductionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deductions' },
        deductionFor: String,
        note: String,
        month: Number,
        year: Number,
        amount: Number,
        outstanding: Number,
        appliedAmount: Number,
        carriedForward: Number,
    }],
    // Days in the month (calendar or company working days, per the Payroll Cycle
    // setting), days the employee was on payroll (joiner/leaver), LOP days and days paid.
    payDays: {
        daysInMonth: { type: Number },
        eligibleDays: { type: Number },
        lopDays: { type: Number, default: 0 },
        paidDays: { type: Number },
        // Earnings/deductions already prorated for a joiner/leaver part month.
        isEarningsProrated: { type: Boolean, default: false },
    },

    // Pre-calculation bookkeeping (services/salarySync.js). A row is only served as-is by
    // Salary Process while it's FRESH: calculatedVersion === staleVersion, i.e. nothing
    // marked it stale ($inc staleVersion) since the calculation that produced it started.
    // A counter rather than timestamps, so clock skew between app instances can't hide a
    // stale mark. processEmpSalary only sets calculatedVersion once a recalculation
    // reproduces the previous run's output (calcHash), so a row never settles on a value
    // an extra run would still change.
    staleVersion: {
        type: Number,
        default: 0
    },
    calculatedVersion: {
        type: Number,
        default: null
    },
    calculatedAt: {
        type: Date,
        default: null
    },
    calcHash: String,
    // services/salary.js SALARY_CALC_ENGINE_VERSION that produced this row — a row from an
    // older calculation version is never served as FRESH.
    calcEngineVersion: Number,
    staleAt: Date,
    staleReason: String,


}, { timestamps: true });

salarySchema.index({ corporateUser: 1, year: 1, month: 1 });
salarySchema.index({ corporateUser: 1, employee: 1, year: 1, month: 1 });

salarySchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Salary = mongoose.model('Salary', salarySchema, 'salary');

module.exports = Salary;
