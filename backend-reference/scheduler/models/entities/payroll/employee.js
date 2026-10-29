const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
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
      enum: ["ACTIVE", "LEAVE", "RESIGNED", "SUSPENDED","CONFIRMED","INPROBATION"],
      default: "ACTIVE",
    },
    // employeeStatus: {
    //   type: String,
    // },
    probationPeriod: {
      type: Number,
      default: 0,
    },
    // employeeGrade: {
    //   type: String,
    // },
  },
  { _id: false }
);
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
  }
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
      required: true,
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
    // experienceInMonth: {
    //   type: String,
    // }

  },
  { _id: false }
);


const otherConfigurationsSchema = new mongoose.Schema(
  {
    enableEPF: {
      type: Boolean,
      default: false,
    },
    // epfUAN: { type: String },
    enableESI: { type: Boolean, default: false },
    // esiNumber: { type: String },
    professionalTax: { type: Boolean, default: false },
    // ptNumber: { type: String },
    laborWelfareFund: { type: Boolean, default: false },
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

    // bankDetails: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "BankDetails",
    // },

    otherConfigurations: otherConfigurationsSchema,
    offBoardingInformation: offBoardingInformationSchema,

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
    aadhaarNumber:{
      type:String,
      default:null,
    }
  },
  { timestamps: true }
);

employeeSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Employee = mongoose.model("Employee", employeeSchema, 'employee');

module.exports = Employee;
