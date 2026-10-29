const mongoose = require("mongoose");

/* ---------------------------------------------------------
   1. SALARY & INCOME → (Section 1 in UI)
   --------------------------------------------------------- */
const salaryIncomeSchema = new mongoose.Schema({
  grossSalary: { type: Number, default: 0 },
  perquisitesValue: { type: Number, default: 0 },
  profitsInLieu: { type: Number, default: 0 },
  total: { type: Number, default: 0 } // auto-calculated
});

/* ---------------------------------------------------------
   2. DEDUCTIONS U/S 16 → (Section 2 in UI)
   --------------------------------------------------------- */
const deduction16Schema = new mongoose.Schema({
  standardDeduction: { type: Number, default: 50000 },
  entertainmentAllowance: { type: Number, default: 0 },
  professionalTax: { type: Number, default: 0 },
  total: { type: Number, default: 0 } // auto
});

/* ---------------------------------------------------------
   3. OTHER INCOME → (Section 4 in UI)
   --------------------------------------------------------- */
const otherIncomeSchema = new mongoose.Schema({
  interestIncome: { type: Number, default: 0 },
  otherSources: { type: Number, default: 0 },
  total: { type: Number, default: 0 } // auto
});

/* ---------------------------------------------------------
   4. CHAPTER VI-A DEDUCTIONS → dynamic rows (Section 6)
   --------------------------------------------------------- */
const chapterViaSchema = new mongoose.Schema({
  section: { type: String, required: true },   // e.g. "80C"
  description: { type: String },
  amount: { type: Number, default: 0 }
});

/* ---------------------------------------------------------
   5. QUARTERLY TDS SUMMARY → Q1–Q4 (Section 9)
   --------------------------------------------------------- */
const quarterSummarySchema = new mongoose.Schema({
  quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4"], required: true },
  receiptNumber24Q: { type: String },
  amountPaidCredited: { type: Number, default: 0 },
  taxDeducted: { type: Number, default: 0 },
  taxDeposited: { type: Number, default: 0 }
});

/* ---------------------------------------------------------
   6. BOOK ADJUSTMENTS (BIN DETAILS) → dynamic rows (Section 10)
   --------------------------------------------------------- */
const bookAdjustmentSchema = new mongoose.Schema({
  serialNo: Number,
  receiptNumber24G: String,
  ddoSerialNo24G: String,
  transferVoucherDate: Date,
  matchingStatus: String
});

/* ---------------------------------------------------------
   7. CHALLAN DETAILS (CIN) → dynamic rows (Section 11)
   --------------------------------------------------------- */
const challanSchema = new mongoose.Schema({
  serialNo: Number,
  bsrCode: String,
  taxDepositedDate: Date,
  challanSerialNo: String,
  matchingStatus: String
});

/* ---------------------------------------------------------
   FINAL FORM 16B MAIN SCHEMA
   --------------------------------------------------------- */
const form16BSchema = new mongoose.Schema({
  /* ---------- EMPLOYEE LINK ---------- */
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  assessmentYear: { type: String }, // 2024-25 etc.

  /* ---------- EMPLOYEE DETAILS ---------- */
  employeeDetails: {
    name: String,
    address: String,
    pan: String,
    tan: String,
    employeeRefNo: String
  },

  /* ---------- EMPLOYER DETAILS ---------- */
  employerDetails: {
    name: String,
    address: String,
    pan: String,
    periodStart: Date,
    periodEnd: Date,
    certificateNumber: String,
    updatedDate: Date,
    citAddress: String
  },

  /* ---------- SALARY & INCOME ---------- */
  salaryIncome: salaryIncomeSchema,

  /* ---------- DEDUCTIONS U/S16 ---------- */
  deductions16: deduction16Schema,

  /* ---------- OTHER INCOME ---------- */
  otherIncome: otherIncomeSchema,

  /* ---------- VI-A (Dynamic Rows) ---------- */
  chapterVia: [chapterViaSchema],

  /* ---------- QUARTER SUMMARY ---------- */
  quarterSummary: [quarterSummarySchema],

  /* ---------- BOOK ADJUSTMENTS ---------- */
  bookAdjustments: [bookAdjustmentSchema],

  /* ---------- CHALLAN DETAILS ---------- */
  challans: [challanSchema],

  /* ---------- TAX COMPUTATION ---------- */
  taxComputation: {
    incomeTax: { type: Number, default: 0 },
    surcharge: { type: Number, default: 0 },
    cess: { type: Number, default: 0 },
    totalTaxLiability: { type: Number, default: 0 },
    tdsDeducted: { type: Number, default: 0 },
    balanceOrRefund: { type: Number, default: 0 }
  },

  incomeChargableAtSalary:{
    totalSalaryInc:{type: Number, default:0},
    deductionUnder16:{type: Number, default:0},
    incomeChargableUnderSal:{type: Number, default:0}
  },
  grossTotalIncome: {
    salaries: { type: Number, default: 0 },
    otherIncomes: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  totalIncome: {
    grossIncome: { type: Number, default: 0 },
    totalDeduction: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 }
  },
  /* ---------- VERIFICATION ---------- */
  verification: {
    declarantName: String,
    fatherOrSpouseName: String,
    capacity: String,
    amountInWords: String,
    date: Date,
    place: String,
    designation: String,
    fullName: String,
    signatureUrl: String,
    amountInDeducted:String,
    amountInDeposited:String
  },

//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }

}, { timestamps: true });

module.exports = mongoose.model("Form16B", form16BSchema);
