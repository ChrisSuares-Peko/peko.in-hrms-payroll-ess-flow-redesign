const mongoose = require('mongoose');

// Created when a Revise Salary action is backdated past months that were already
// PAID/APPROVED/COMPLETED — the sum of (new structure - old paid structure) across those
// months, paid as a single earnings line in the next unprocessed payroll run and taxed
// there via the marginal method (see calculateTax in services/salary.js).
const coveredMonthSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    differential: { type: Number, required: true },
    // The Basic-Salary-only portion of `differential` for this month — the wage base
    // arrears' PF top-up is computed from at payout time (see fetchArrearsForPayout /
    // services/salary.js), kept separate from the full gross differential above.
    basicDifferential: { type: Number, default: 0 },
  },
  { _id: false }
);

const arrearsSchema = new mongoose.Schema(
  {
    corporateUser: {
      type: String,
      ref: 'CorporateUser',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    salaryStructureVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructureVersion',
      required: true,
    },
    amount: { type: Number, required: true },
    // Sum of coveredMonths[].basicDifferential — the Basic-only slice of `amount` that
    // attracts PF at payout, per the "arrears attract PF on arrear Basic" rule.
    basicAmount: { type: Number, default: 0 },
    coveredMonths: [coveredMonthSchema],
    payoutMonth: { type: Number, required: true },
    payoutYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

arrearsSchema.index({ employee: 1, payoutYear: 1, payoutMonth: 1 });

arrearsSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Arrears = mongoose.model('Arrears', arrearsSchema);
module.exports = Arrears;
