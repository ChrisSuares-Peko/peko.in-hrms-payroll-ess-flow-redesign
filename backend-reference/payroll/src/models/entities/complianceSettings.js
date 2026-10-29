const mongoose = require("mongoose");

const ComplianceSettingsSchema = new mongoose.Schema(
  {
    corporateUser: {
      type: String,
      ref: 'CorporateUser',
      required: true,
    },
    epf: {
      epfNumber: {
        type: String,

      },
      // Legacy free-text fields — no longer written by the current EPF settings form
      // (superseded by pfWagesPolicy below), kept only so resolveEpfPolicyFromCompliance
      // Settings (services/calculateEmployerPf.js) can still read an org's pre-migration
      // choice via string-matching, without needing a data migration.
      employeeContributionRate: {
        type: String,

      },
      employerContributionRate: {
        type: String,

      },
      // The canonical PF wage policy signal — whether EPF contributions are computed on
      // the statutory ₹15,000 wage ceiling or on the employee's full Basic Salary.
      pfWagesPolicy: {
        type: String,
        enum: ['CAPPED_15000', 'FULL_BASIC'],
        default: 'CAPPED_15000',
      },
      enableProRatedPfWage: {
        type: Boolean,
        default: true,
      },
      considerSalaryComponents: {
        type: Boolean,
        default: true,
      },
      // "EPF applies to this establishment" — mandatory at 20+ active employees, optional
      // below that. OFF means no PF is deducted or contributed for anyone. The current
      // setting only; which months it actually governs comes from applicabilityHistory
      // (see isEpfApplicableForPeriod in services/calculateEmployerPf.js).
      isApplicable: {
        type: Boolean,
        default: true,
      },
      // One entry per flip, effective from the first month with no payroll run recorded
      // at the time of the flip — already-paid months keep what they had.
      applicabilityHistory: [
        {
          _id: false,
          isApplicable: { type: Boolean, required: true },
          effectiveMonth: { type: Number, required: true },
          effectiveYear: { type: Number, required: true },
          changedAt: { type: Date, default: Date.now },
          changedBy: { type: String, default: null },
          // Set on an automatic flip, e.g. EPF switched back on when headcount reached 20.
          reason: { type: String, default: null },
        },
      ],
      // "Show PF Employee's Contribution in Earnings" — display only: the employee's PF
      // share is also listed as a locked Earnings line, taken out of Special Allowance.
      // Gross, CTC, deductions and take-home never change. Default (and recommended) OFF.
      showEmployeePfInEarnings: {
        type: Boolean,
        default: false,
      },
      // Same timing as applicabilityHistory — each flip effective from the first unpaid
      // month, so issued payslips never change.
      earningsLineHistory: [
        {
          _id: false,
          showInEarnings: { type: Boolean, required: true },
          effectiveMonth: { type: Number, required: true },
          effectiveYear: { type: Number, required: true },
          changedAt: { type: Date, default: Date.now },
          changedBy: { type: String, default: null },
        },
      ],
    },

    esi: {
      esiNumber: {
        type: String,

      },
      deductionCycle: {
        type: String,
        enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],

      },
      employeeContribution: {
        type: Number,

      },
      employerContribution: {
        type: Number,

      },
     


    },

    professionalTax: {
      ptNumber: {
        type: String,

      },
      deductionCycle: {
        type: String,
        enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],

      },
      incomeSlabs: [
        {
          incomeStartRange: {
            type: Number,

          },
          incomeEndRange: {
            type: Number,

          },
          taxAmount: {
            type: Number,

          },
        },
      ],
    },

    // Org-level LWF defaults — a work state (seeds new employees' otherConfigurations.lwf
    // .workState and is the schedule fallback for anyone without one, via
    // lwfStateSchedule.js's scheduleForState) and a registration number for compliance
    // filing. Contribution AMOUNTS are per-employee only (see Employee.otherConfigurations
    // .lwf) — there is deliberately no org-wide flat-amount default anymore, since LWF
    // amounts vary too much by state/role to have one.
    laborWelfareFund: {
      workState: {
        type: String,
      },
      registrationNumber: {
        type: String,
      },
    },
    tds: {
      tan: {
        type: String,
      },
       taxRegime: {
      type: String,
      enum: ["Old Tax Regime", "New Tax Regime"],
      default: "New Tax Regime",
    },
      assignedCommissioner: {
        type: String,
      },
      address: {
        type: String,
      },
      bsr: {
        bankName: {
          type: String,
        },
        bsrCode: {
          type: String,
        },
      },
      authorizedSignatoryDetails: {
        name: {
          type: String,
        },
        fathersName: {
          type: String,
        },
        signature: {
          type: String, // This could store the URL or path to the signature file
        },
        placeOfSigning: {
          type: String,
        },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ComplianceSettings", ComplianceSettingsSchema);
