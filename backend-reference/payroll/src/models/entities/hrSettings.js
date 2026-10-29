const mongoose = require('mongoose');

// Server-owned catalog of documents an employee may be asked to submit during
// ESS onboarding. Corporates can only toggle `required` per key (see
// setOnboardingDocuments) — the keys/labels themselves aren't admin-editable.
const DEFAULT_ONBOARDING_DOCUMENTS = [
  { key: 'panCard', label: 'PAN Card', required: true },
  { key: 'aadhaarCard', label: 'Aadhaar Card', required: true },
  { key: 'bankAccountDetails', label: 'Bank Account Details', required: true },
  { key: 'passport', label: 'Passport', required: false },
  { key: 'educationalCertificates', label: 'Educational Certificates', required: false },
  { key: 'experienceLetters', label: 'Experience Letters', required: false },
  { key: 'signedOfferLetter', label: 'Signed Offer Letter', required: false },
];

const onboardingDocumentSchema = new mongoose.Schema({
  key: String,
  label: String,
  required: { type: Boolean, default: false },
}, { _id: false });

const hrSettingsSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    leaveSettings: {
        annualLeave: {
            type: Number,
            default: 0
        },
        sickLeave: {
            type: Number,
            default: 0
        },
        parentalLeave: {
            type: Number,
            default: 0
        },
        sabbaticalLeave: {
            type: Number,
            default: 0
        },
        studyLeave: {
            type: Number,
            default: 0
        },
        HajjAndUmrahLeave: {
            type: Number,
            default: 0
        },
        maternityLeave: {
            type: Number,
            default: 0
        },
        officialLeavesAndVacations: {
            type: Number,
            default: 0
        },
        otherPaidLeaves: {
            type: Number,
            default: 0
        },
        eligibilityTimePeriod: { //in years
            type: Number,
            default: 0
        },
    },
    gratuitySettings: {
        option1: String,
        option2: String,
        option3: String,
        option4: String
    },
    officialDocuments: {
        hrManagerName: {
            type: String,
            required: true
        },
        hrManagerSignature: {
            type: String,
            required: true  //File upload and url to stored here
        },
        companyOfficialStamp: {
            type: String,
            required: true  //File upload and url to stored here
        },
        MOLNumber: {
            type: String,
            required: true
        },
        establishmentId: {
            type: String,
            required: true
        },
    },
    payrollSettings: {
        isEditable: {
            type: Boolean,
            default: true
        },
        organizationWorkingDays: {
            type: Number,
            required: true
        },
        salaryCycleDay: {
            type: Number,
            required: true
        },
        payrollStartsFrom: {
            type: Date,
            required: true
        },
        selectedWeekdaysCount: {
            type: Array
        }
    },
    onboardingDocuments: {
        type: [onboardingDocumentSchema],
        default: () => DEFAULT_ONBOARDING_DOCUMENTS,
    },
    checkInOutEnabled: {
        type: Boolean,
        default: false,
    },
    gracePeriodMinutes: {
        type: Number,
        default: 0,
    },
    defaultWorkSchedule: {
        checkInTime: { type: String, default: '09:00' },
        checkOutTime: { type: String, default: '18:00' },
    },
}, { timestamps: true });

hrSettingsSchema.index({ corporateUser: 1 });

hrSettingsSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const HrSettings = mongoose.model('HrSettings', hrSettingsSchema);
HrSettings.DEFAULT_ONBOARDING_DOCUMENTS = DEFAULT_ONBOARDING_DOCUMENTS;

module.exports = HrSettings;
