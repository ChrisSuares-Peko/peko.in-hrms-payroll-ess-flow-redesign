const mongoose = require('mongoose');

const slabEntrySchema = new mongoose.Schema({
  from:          { type: Number },
  to:            { type: Number, default: null },
  rate:          { type: Number },   // stored as percentage e.g. 5, not 0.05
  taxableAmount: { type: Number },
  tax:           { type: Number }
}, { _id: false });

const taxInformationSchema = new mongoose.Schema({
  fy:           { type: String,  default: "" },
  regime:       { type: String,  default: "new" },
  grossAnnual:  { type: Number,  default: 0 },

  standardDeduction: { type: Number, default: 0 },
  hraExemption:      { type: Number, default: 0 },
  deduction80C:      { type: Number, default: 0 },
  deduction80GG:     { type: Number, default: 0 },
  exemptions:        { type: Number, default: 0 },

  taxableIncome:   { type: Number, default: 0 },
  slabBreakdown:   [slabEntrySchema],

  taxBeforeRebate: { type: Number, default: 0 },
  rebate:          { type: Number, default: 0 },
  marginalRelief:  { type: Number, default: 0 },
  // The Section 87A income threshold actually used for this FY/regime (₹5L old regime,
  // ₹7L/₹12L new regime depending on FY) — persisted so the TDS drawer's rebate tooltip
  // can show the true limit for a historical/already-paid month, not just the current one.
  rebateLimit:     { type: Number, default: 0 },
  tax:             { type: Number, default: 0 },
  // Section surcharge on tax above ₹50L taxable income (post-87A), after any marginal
  // relief at the ₹50L/₹1Cr/₹2Cr/₹5Cr boundary crossed — kept separate from `cess` so TDS
  // details, Form 16 Part B and Form 24Q can each show/report it as its own line item.
  surcharge:       { type: Number, default: 0 },
  // The rate/threshold/pre-relief amount behind `surcharge` above — persisted so the TDS
  // drawer's Surcharge info icon can show its own worked breakdown (mirrors rebateLimit's
  // reasoning) for a historical/already-paid month too, not just the current one.
  surchargeRate:         { type: Number, default: 0 }, // e.g. 0.1, 0.15, 0.25, 0.37
  surchargeThreshold:    { type: Number, default: 0 }, // ₹50L/1Cr/2Cr/5Cr crossed, or 0
  surchargeBeforeRelief: { type: Number, default: 0 }, // uncapped surcharge before marginal relief
  cess:            { type: Number, default: 0 },
  totalTax:        { type: Number, default: 0 },
  tdsMonthly:      { type: Number, default: 0 }
}, { _id: false });

// Account-wise EPF breakup for the month this Salary record was processed for — not a
// single employer lump sum. pfWageCeiling records which statutory ceiling (₹15,000 or
// ₹25,000) was actually applied, so a stored historical record is self-documenting about
// which rule produced it, independent of whatever the ceiling is when read back later.
const epfBreakupSchema = new mongoose.Schema({
  pfWage:          { type: Number, default: 0 },
  pfWageCeiling:   { type: Number, default: 0 },
  employeeEpf:     { type: Number, default: 0 }, // A/c 1 (employee side)
  employerEps:     { type: Number, default: 0 }, // A/c 10 — Pension
  employerEpf:     { type: Number, default: 0 }, // A/c 1 (employer side)
  edli:            { type: Number, default: 0 }, // A/c 21
  adminCharges:    { type: Number, default: 0 }, // A/c 2
  employerTotal:   { type: Number, default: 0 }, // EPS + Employer EPF + EDLI + Admin
  totalDeposit:    { type: Number, default: 0 }, // employeeEpf + employerTotal
}, { _id: false });

const salaryInformationSchema = new mongoose.Schema({
  basicPay:        { type: Number, default: 0 },
  increamentAmount:{ type: Number, default: 0 },
  hraAmount:       { type: Number, default: 0 },
  daAmount:        { type: Number, default: 0 },
  bonus:           { type: Number, default: 0 },
  incentiveAmount: { type: Number, default: 0 },
  overtimeAmount:  { type: Number, default: 0 },
  leavesAmount:    { type: Number, default: 0 },
  // Basic portion of this month's arrears payout — kept so a Loss of Pay recompute of an
  // APPROVED salary can rebuild the arrears PF top-up without re-querying settled arrears.
  arrearsBasic:    { type: Number, default: 0 },
  other:           { type: Number, default: 0 },
  grossSalary:     { type: Number, default: 0 },

  epfAmount:       { type: Number, default: 0 },
  esiAmount:       { type: Number, default: 0 },
  lwfAmount:       { type: Number, default: 0 },
  deductionAmount: { type: Number, default: 0 },

  tdsAmount:       { type: Number, default: 0 },
  // 'MANUAL' when tdsAmount came from an HR-entered Old Tax Regime amount (TdsOverride)
  // instead of the tax engine — taxInformation then still describes the engine's own
  // figures, not the amount actually deducted.
  tdsSource:       { type: String, enum: ['CALCULATED', 'MANUAL'], default: 'CALCULATED' },

  earnings: [{ componentName: String, calculatedAmount: Number }],
  deductions: [{ componentName: String, calculatedAmount: Number }],

  taxInformation: taxInformationSchema,
  epfBreakup: epfBreakupSchema
}, { _id: false, strict: false });

module.exports = salaryInformationSchema;
