const mongoose = require('mongoose');

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
    }
}, { timestamps: true });

hrSettingsSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const HrSettings = mongoose.model('HrSettings', hrSettingsSchema);

module.exports = HrSettings;
