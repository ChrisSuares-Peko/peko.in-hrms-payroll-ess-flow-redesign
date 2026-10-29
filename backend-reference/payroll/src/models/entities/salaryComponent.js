
// const salaryComponentSchema = new mongoose.Schema({
//     corporateUser: {
//         type: String,
//         ref: 'CorporateUser',
//         required: true,
//     },
//     employee: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Employee",
//     },
//     componentName: {
//         type: String,
//         required: true
//     },
//     category: {
//         type: String,
//         enum: ['SALARY', 'BONUS', 'ALLOWANCE'],
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
//     calculationFrequency: {
//         type: String,
//         enum: ['MONTHLY', 'YEARLY'],
//         required: true
//     },
//     calculationBasedOn: {
//         type: String,
//         required: false
//     },
//     status: {
//         type: String,
//         enum: ['ACTIVE', 'INACTIVE'],
//         required: true
//     },
//     isGlobal: {
//         type: Boolean,
//         default: true
//     },
//     globalComponentId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'SalaryComponent',
//         default: null
//     }

// }, { timestamps: true });

// salaryComponentSchema.set('toJSON', {
//     transform: function (doc, ret) {
//         ret.id = ret._id;
//         delete ret._id;
//         delete ret.__v;
//     }
// });

// const SalaryComponent = mongoose.model('SalaryComponent', salaryComponentSchema);
// module.exports = SalaryComponent;


const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
    },
    componentName: {
        type: String,
        required: true
    },
    // category: {
    //     type: String,
    //     enum: ['SALARY', 'BONUS', 'ALLOWANCE'],
    //     required: true
    // },
    calculationType: {
        type: String,
        enum: ['FIXED', 'PERCENTAGE', 'BALANCING'],
        required: true
    },
    amountPercentage: {
        type: Number,
        required: false
    },
    // amount: {
    //     type: Number,
    //     required: false
    // },
    // percentage: {
    //     type: String,
    //     required: false
    // },
    // calculationFrequency: {
    //     type: String,
    //     enum: ['MONTHLY', 'YEARLY'],
    //     required: true
    // },
    calculationBasedOn: {
        type: String,
        required: false
    },
    // Only relevant when calculationType === 'PERCENTAGE'. 'COMPONENT' (default) resolves
    // against calculationBasedOn (another component's id) — existing behavior. 'BASIC_SALARY'/
    // 'GROSS_SALARY' let a component be defined as "X% of Basic/Gross" directly, mirroring
    // DeductionComponent's salaryDeductionType. 'CTC' is "X% of the employee's monthly
    // CTC" — resolved against the committed CTC by solveEarningsForCtc.
    calculationBasis: {
        type: String,
        enum: ['COMPONENT', 'BASIC_SALARY', 'GROSS_SALARY', 'CTC'],
        default: 'COMPONENT'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        required: true
    },
    // When false, this component still counts toward CTC (with its own employer-side
    // cost, if any) but is excluded from Gross Salary, ESI wages, the Labour-Code gross
    // check, and monthly TDS — and is never paid out in the monthly payroll run. Default
    // true keeps every existing component (and every employee with no benefits
    // configured) byte-identical to today.
    isPartOfGross: {
        type: Boolean,
        default: true
    },
    isGlobal: {
        type: Boolean,
        default: true
    },
    globalComponentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent',
        default: null
    },
    // Set when this employee's amount/basis was deliberately set away from the org's
    // global template for this component (Edit Basic Salary / Edit Component — see
    // redistributeBasicSalary/redistributeEarningComponent), as opposed to just being a
    // frozen snapshot that still happens to follow the template's current rule (e.g. a
    // fresh hire's Basic, or Revise Salary's own re-solve). effectiveRule (mergeComponents.js)
    // reads this to know when to use THIS row's own values instead of re-deriving from the
    // template — without it, any such manual override is silently discarded the next time
    // the structure is re-solved (e.g. the CTC tab's own unpaid-month self-heal).
    overridesGlobalRule: {
        type: Boolean,
        default: false
    },
    employeeEmail: {
        type: String,
        default: true
    },

}, { timestamps: true });

salaryComponentSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});
salaryComponentSchema.index(
    { corporateUser: 1, componentName: 1 },
    { unique: true, partialFilterExpression: { isGlobal: true } }
);
salaryComponentSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

const SalaryComponent = mongoose.model('SalaryComponent', salaryComponentSchema, 'salarycomponent');
module.exports = SalaryComponent;
