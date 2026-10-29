const mongoose = require("mongoose");

const incomeDeclarationFormSchema = new mongoose.Schema(
  {
    corporateUser: {
      type: String,
      ref: "CorporateUser",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
    },
    hraDetails: {
      totalRentPaid: Number,
      landlordName: String,
      landlordPAN: String,
      rentedPropertyAddress: String,
      rentReceipts: String,
    },
    ltaDetails: {
      ltaAmountClaimed: Number,
      travelDate: Date,
      travelDestination: String,
      travelProof: String,
    },
    homeLoanInterestDetails: {
      interestPaid: Number,
      lenderName: String,
      lenderPAN: String,
      lenderAddress: String,
      loanProof: String,
    },
    incomeDeclaration: {
      annualIncome: Number,
      incomeProof: String,
    },
    chapterVIA: [
      {
        investmentType: String,
        amountInvested: Number,
        proofDocument: String,
      },
    ],
    homeLoanDeductions: [
      {
        deductionType: String,
        amountClaimed: Number,
        institutionName: String,
        certificationDate: Date,
        proofDocument: String,
      },
    ],
  },
  { timestamps: true }
);

incomeDeclarationFormSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const IncomeDeclarationForm = mongoose.model(
  "IncomeDeclarationForm",
  incomeDeclarationFormSchema
);

module.exports = IncomeDeclarationForm;
