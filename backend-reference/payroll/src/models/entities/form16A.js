const mongoose = require("mongoose");

/* ---------------------------------------------------------
   1. QUARTER SUMMARY TABLE
   --------------------------------------------------------- */
const quarterSummarySchema = new mongoose.Schema({
  quarter: { type: String, enum: ["Q1", "Q2", "Q3", "Q4"], required: true },

  receiptNumber: { type: String },              // Receipt No. of quarterly statement
  amountPaidCredited: { type: Number, default: 0 },
  taxDeducted: { type: Number, default: 0 },
  taxDeposited: { type: Number, default: 0 }
});

/* ---------------------------------------------------------
   2. BOOK ADJUSTMENT (BIN DETAILS) TABLE - MULTIPLE ROWS
   --------------------------------------------------------- */
const bookAdjustmentSchema = new mongoose.Schema({
  serialNo: { type: Number },                   // Sl No.
  taxDeposited: { type: Number, default: 0 },

  receiptNumber24G: { type: String },           // Receipt No. of Form 24G
  ddoSerialNo24G: { type: String },             // DDO Serial No.
  transferVoucherDate: { type: Date },          // dd/mm/yyyy

  form24GMatchingStatus: { type: String }       // Matched / Not matched
});

/* ---------------------------------------------------------
   3. CHALLAN DETAILS (CIN DETAILS) TABLE - MULTIPLE ROWS
   --------------------------------------------------------- */
const challanSchema = new mongoose.Schema({
  serialNo: { type: Number },                   // Sl No.
  taxDeposited: { type: Number, default: 0 },

  bsrCode: { type: String },                    // Bank BSR Code
  taxDepositedDate: { type: Date },             // dd/mm/yyyy
  challanSerialNo: { type: String },

  oltasMatchingStatus: { type: String }         // Matched / Not matched
});

/* ---------------------------------------------------------
   4. MAIN FORM 16A SCHEMA
   --------------------------------------------------------- */
const form16ASchema = new mongoose.Schema(
  {
    /* -------------------- EMPLOYEE DETAILS -------------------- */
    employeeDetails: {
      name: { type: String, required: true },
      address: { type: String },
      pan: { type: String, required: true },
      tan: { type: String },
      employeeRefNo: { type: String }
    },

    /* -------------------- EMPLOYER DETAILS -------------------- */
    employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
    assessmentYear: {type: String},    
    employerDetails: {
      name: { type: String, required: true },
      address: { type: String },
      pan: { type: String, required: true },
      periodStart: { type: Date },
      periodEnd: { type: Date },
      certificateNumber: { type: String },
      updatedDate: { type: Date },
      citAddress: { type: String }
    },

    /* -------------------- QUARTER SUMMARY (Q1–Q4) -------------------- */
    quarterSummary: [quarterSummarySchema],

    /* -------------------- BOOK ADJUSTMENT ROWS (Add New Row) -------------------- */
    bookAdjustments: [bookAdjustmentSchema],

    /* -------------------- CHALLAN ROWS (Add New Row) -------------------- */
    challans: [challanSchema],

    /* -------------------- META -------------------- */
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form16A", form16ASchema);
