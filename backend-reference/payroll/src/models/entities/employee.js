const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Stable catalog key (see HrSettings.onboardingDocuments) — lets ESS onboarding
    // replace a specific document on re-upload instead of matching by display name.
    key: String,
    name: String,
    url: String,
    expiryDate: Date,
    holderName: String,
  },
  { timestamps: true }
);

const employeeInformationSchema = new mongoose.Schema(
  {
    dateOfJoin: {
      type: Date,
    },
    employeeId: {
      type: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: String,
    },
    reportingStaff: {
      type: mongoose.Schema.Types.ObjectId,
    },
    workEmailId:{
      type: String,
    },
    workingDays: {
       type: Number,
    },
    timeSchedule: {
      type: String,
    },
    workingHours: {
      type: Number,
    },
    contractType: {
      type: String,
      enum: ["PART_TIME", "FULL_TIME"],
    },
    employeeStatus: {
      type: String,
      enum: ["ACTIVE", "LEAVE", "RESIGNED", "SUSPENDED","CONFIRMED","INPROBATION","NEW_HIRE"],
      default: "ACTIVE",
    },
    // employeeStatus: {
    //   type: String,
    // },
    probationPeriod: {
      type: Number,
      default: 0,
    },
    // Set when HR confirms the employee at the end of probation (Confirm on the profile).
    confirmationDate: {
      type: Date,
    },
    confirmedBy: {
      type: String,
    },
    taxRegime: { type: String, default: null },
    // employeeGrade: {
    //   type: String,
    // },
  },
  { _id: false }
);
const offerLetterSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["PENDING", "SIGNED", "REJECTED", "EMAIL_CHANGED"],
    default: "PENDING",
  },
  sentAt: { type: Date },
  signedAt: { type: Date },
  documentUrl: { type: String },
  eSignId: { type: String },
}, { _id: false })
const offBoardingInformationSchema = new mongoose.Schema({
  offBoardingDate: {
    type: Date,
  },
  lastWorkingDay: {
    type: Date,
  },
  resignationLetter: {
    type: String,
  },
  noticePeriod: {
    type: Number,
    default: 0
  },
  offBoardingType: {
    type: String,
    enum: ['RESIGNATION', 'SUSPENSION'],
  },
  reasonForOffBoarding: {
    type: String,
  },
  // employeeStatus before offboarding replaced it with RESIGNED/SUSPENDED, so cancelling the
  // offboarding can put the employee back on probation or confirmed.
  previousEmployeeStatus: {
    type: String,
  }
}, { _id: false })

// A cancelled offboarding (resignation withdrawn), kept so the employee's history shows both
// the resignation and its withdrawal.
const offBoardingHistorySchema = new mongoose.Schema({
  offBoardingDate: Date,
  lastWorkingDay: Date,
  resignationLetter: String,
  noticePeriod: Number,
  offBoardingType: String,
  reasonForOffBoarding: String,
  previousEmployeeStatus: String,
  status: {
    type: String,
    enum: ['CANCELLED'],
    default: 'CANCELLED',
  },
  cancelledAt: Date,
  cancelledBy: String,
  cancellationReason: String,
}, { _id: false })
// Create a personal information schema
const personalInformationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHERS"],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },    
    mobileNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: false,
    },
    addressLine1: {
      type: String,
      required: false,
    },
    addressLine2: {
      type: String,
      required: false,
    },
    pinCode: {
      type: String,
    },
    emergencyContactName: {
      type: String,
    },
    emergencyContactNo: {
      type: String,
    },
    emergencyContactRelation: {
      type: String,
    },
    isDiffrentlyAbled: {
      type: Boolean,
    },
    passportNo: { type: String, default: null },
    passportIssuedCountry: { type: String, default: null },
    passportIssuedDate: { type: Date, default: null },
    passportExpiryDate: { type: Date, default: null },
    // experienceInMonth: {
    //   type: String,
    // }

  },
  { _id: false }
);


const otherConfigurationsSchema = new mongoose.Schema(
  {
    // EPF/ESI default to true (opt-OUT), not false (opt-IN) — an employee who's never had
    // this touched should show as Active/covered by default (matching the underlying
    // DeductionComponent, which is itself active by default), not silently Inactive until
    // someone remembers to flip it. Only an explicit `false` should turn a component off.
    // Professional Tax / Labour Welfare Fund / TDS below do NOT follow this convention —
    // they default to false (opt-IN): only an explicit `true` should turn them on. Readers
    // must match whichever convention applies to the specific field (see
    // useEmployeeStatutoryDetails.ts) — treating an opt-IN field's `undefined` as Active
    // (the same check that's correct for EPF/ESI) is backwards for these.
    enableEPF: {
      type: Boolean,
      default: true,
    },
    epfUAN: { type: String, default: null },
    enableESI: { type: Boolean, default: true },
    esiNumber: { type: String, default: null },
    // Set/cleared automatically (View CTC) to track ESI contribution-period continuation
    // — once covered, a mid-period raise above the ₹21,000 ceiling shouldn't drop
    // coverage until the current Apr–Sep/Oct–Mar period ends.
    esiCoverageSince: { type: Date, default: null },
    professionalTax: { type: Boolean, default: false },
    // ptNumber: { type: String },
    laborWelfareFund: { type: Boolean, default: false },
    // Per-employee LWF config — mirrors ESI's split above (config lives here, the money
    // is computed live by services/lwfCalc.js, never persisted as a component row).
    // Falls back to ComplianceSettings.laborWelfareFund's flat org default wherever a
    // field here is unset.
    lwf: {
      type: new mongoose.Schema(
        {
          workState: { type: String, default: null },
          // Overrides the work state's default schedule (utils/lwfStateSchedule.js) when set.
          scheduleOverride: { type: String, enum: ['MONTHLY', 'JUNE_DECEMBER', 'DECEMBER_ONLY', null], default: null },
          employeeShareType: { type: String, enum: ['FLAT', 'PERCENT_OF_GROSS', null], default: null },
          employeeShareValue: { type: Number, default: null },
          employerShareType: { type: String, enum: ['FLAT', 'PERCENT_OF_GROSS', null], default: null },
          employerShareValue: { type: Number, default: null },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    tds: { type: Boolean, default: false },
    tdsRegime: { type: String },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    corporateUser: {
      type: String,
      ref: "CorporateUser",
      required: true,
    },
    profileImage: {
      type: String,
    },
    personalInformation: personalInformationSchema,
    employeeInformation: employeeInformationSchema,

    // salaryComponents: [
    //   {
    //     component: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "SalaryComponent12",
    //     },
    //     type: {
    //       type: String,
    //       enum: ["CUSTOM", "DEFAULT"],
    //     },
    //   },
    // ],
    salaryComponents: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    employeeDocuments: {
      type: [documentSchema],
      default: [],
    },

    bankDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankDetails",
    },

    otherConfigurations: otherConfigurationsSchema,
    offBoardingInformation: offBoardingInformationSchema,
    offBoardingHistory: {
      type: [offBoardingHistorySchema],
      default: undefined,
    },
    offerLetter: offerLetterSchema,
    // Each Extend probation from the profile, so the Basic Information tab can show the history.
    probationExtensions: {
      type: [new mongoose.Schema({
        months: Number,
        reason: String,
        previousEndDate: Date,
        newEndDate: Date,
        extendedAt: Date,
        extendedBy: String,
      }, { _id: false })],
      default: undefined,
    },
    // Set true the first time the employee accesses their ESS profile.
    isEss: {
      type: Boolean,
      default: false,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
    isEmployeeDeleted: {
      type: Boolean,
      default: false
    },
    panNumber:{
      type: String,
      default: null
    },
    // True only once panAdhar.js's verifyPan gets an actual valid=true response from
    // Cashfree — panNumber alone isn't a reliable "verified" signal since bulk upload (and
    // any other creation path) writes the entered PAN there directly, before any
    // verification happens.
    panVerified: {
      type: Boolean,
      default: false,
    },
    aadhaarNumber:{
      type:String,
      default:null,
    },
    // Mirrors panVerified for Aadhaar — set by verifyAadhaarOtp on a VALID OTP response.
    aadhaarVerified: {
      type: Boolean,
      default: false,
    },
    // Cashfree's offline-Aadhaar OTP session id, set by generateAadhaarOtp and consumed by
    // verifyAadhaarOtp's own ref_id flow — stored for reference/audit.
    aadhaarVerificationId: {
      type: String,
      default: null,
    }
  },
  { timestamps: true }
);

employeeSchema.index({ corporateUser: 1, isEmployeeDeleted: 1 });
employeeSchema.index({ corporateUser: 1, 'employeeInformation.employeeStatus': 1 });

employeeSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Employee = mongoose.model("Employee", employeeSchema, 'employee');

module.exports = Employee;
