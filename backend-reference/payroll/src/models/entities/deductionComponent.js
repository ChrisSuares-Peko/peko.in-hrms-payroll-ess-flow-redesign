// const mongoose = require('mongoose');

// const deductionComponentSchema = new mongoose.Schema({
//     corporateUser: {
//         type: String,
//         ref: 'CorporateUser',
//         required: true
//     },
//     employee: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Employee',
//         default: null
//     },
//     deductionName: {
//         type: String,
//         required: true
//     },
//     deductionType: {
//         type: String,
//         required: true
//     },
//     calculationType: {
//         type: String,
//         enum: ['FIXED', 'PERCENTAGE'],
//         required: true
//     },
//     amount: {
//         type: Number,
//         required: false
//     },
//     percentage: {
//         type: String,
//         required: false
//     },
//     calculationBasis: {
//         type: String,
//         enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
//         required: true
//     },
//     status: {
//         type: String,
//         enum: ['ACTIVE', 'INACTIVE'],
//         required: true
//     },
//     applicabilityCriteria: {
//         type: String,
//         default: null
//     },
//     isGlobal: {
//         type: Boolean,
//         default: true
//     },
//     globalComponentId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'DeductionComponent',
//         default: null
//     }
// }, { timestamps: true });

// deductionComponentSchema.set('toJSON', {
//     transform: function (doc, ret) {
//         ret.id = ret._id;
//         delete ret._id;
//         delete ret.__v;
//     }
// });

// const DeductionComponent = mongoose.model('DeductionComponent', deductionComponentSchema);
// module.exports = DeductionComponent;

const mongoose = require('mongoose');

const deductionComponentSchema = new mongoose.Schema({
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
    deductionName: {
        type: String,
        required: true
    },
    calculationType: {
        type: String,
        enum: ['FIXED', 'PERCENTAGE'],
        required: true
    },
    amountPercentage: {
        type: Number,
        required: false
    },
    calculationBasis: {
        type: String,
        enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        required: true
    },
    salaryDeductionType:{
        type: String,
        enum: ['GROSS_SALARY','BASIC_SALARY'],
        default: 'BASIC_SALARY',
        required: false
    },
    // applicabilityCriteria: {
    //     type: String,
    //     default: null
    // },
    isGlobal: {
        type: Boolean,
        default: true
    },
    globalComponentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeductionComponent',
        default: null
    }
}, { timestamps: true });

// Enforces at the DB level what createDeductionComponent's application-layer check
// (findOne-then-create, itself racy) only intends: one global deduction per name per
// org — e.g. exactly one global "Provident Fund (PF)" row. Scoped to isGlobal:true only
// (a partial index) since many employees legitimately each have their own
// employee-specific override sharing that same name. This is what actually closes the
// race ensureProvidentFundDeductionExists's atomic upsert narrows but can't fully
// close on its own — two truly simultaneous upserts can still both attempt an insert;
// this index guarantees the DB rejects the second one instead of silently keeping both.
deductionComponentSchema.index(
    { corporateUser: 1, deductionName: 1 },
    { unique: true, partialFilterExpression: { isGlobal: true } }
);

deductionComponentSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

const DeductionComponent = mongoose.model('DeductionComponent', deductionComponentSchema, 'deductioncomponent');
module.exports = DeductionComponent;

