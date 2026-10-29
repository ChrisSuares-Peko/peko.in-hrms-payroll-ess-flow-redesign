const mongoose = require('mongoose');

// One document per Revise Salary action — a frozen snapshot of an employee's resolved
// earnings as of a given effective month, so the payroll run can resolve "what was Basic
// Salary for month X" without depending on whatever SalaryComponent rows happen to be
// live today. Snapshots RUPEE AMOUNTS, not formulas, so later org-template changes never
// retroactively rewrite history.
const earningSnapshotSchema = new mongoose.Schema(
  {
    componentName: { type: String, required: true },
    calculationType: { type: String, enum: ['FIXED', 'PERCENTAGE', 'BALANCING'], required: true },
    calculationBasis: { type: String },
    amountPercentage: { type: Number, required: true },
    calculatedAmount: { type: Number, required: true },
    isPartOfGross: { type: Boolean, default: true },
  },
  { _id: false }
);

const salaryStructureVersionSchema = new mongoose.Schema(
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
    // First day of the month this structure takes effect from.
    effectiveFrom: {
      type: Date,
      required: true,
    },
    annualCTC: { type: Number, required: true },
    monthlyCTC: { type: Number, required: true },
    // Record only: whether employer PF was netted out of this CTC when it was solved (i.e.
    // EPF applied to the establishment then). Re-solves don't read it — they use the EPF
    // setting of the period being solved, so the agreed CTC stays fixed and its split
    // follows the switch. Pre-existing versions read as true, which is how they were solved.
    employerPfInCtc: { type: Boolean, default: true },
    previousAnnualCTC: { type: Number, default: null },
    // employerPfInCtc of the structure this revision replaced — lets undo restore the
    // prior CTC with the netting it was actually committed under.
    previousEmployerPfInCtc: { type: Boolean, default: true },
    earnings: [earningSnapshotSchema],
    // The employee's live-resolved earnings immediately BEFORE this revision — lets
    // undoLatestRevision (reviseSalary.js) restore the exact prior Basic/Special
    // Allowance split rather than just knowing the prior CTC total.
    previousEarnings: [earningSnapshotSchema],
    reason: { type: String, default: null },
    createdBy: {
      type: String,
      default: null,
    },
    arrears: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Arrears',
      default: null,
    },
  },
  { timestamps: true }
);

salaryStructureVersionSchema.index({ employee: 1, effectiveFrom: -1 });

salaryStructureVersionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const SalaryStructureVersion = mongoose.model('SalaryStructureVersion', salaryStructureVersionSchema, 'salarystructureversion');
module.exports = SalaryStructureVersion;
