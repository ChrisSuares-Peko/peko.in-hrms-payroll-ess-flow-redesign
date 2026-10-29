const mongoose = require('mongoose');

const organizationSettingsSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    companyProfile: {
        companyName: {
            type: String,
            required: false,
        },
        state: {
            type: String,
            required: false,
        },
        contactNumber: {
            type: String,
            required: false,
        },
        emailAddress: {
            type: String,
            required: false,
        },
        industry: {
            type: String,
            required: false,
        },
        companyLogo: {
            type: String,
            required: false,

        },
        companyAddressLine1: {
            type: String,
            required: false,

        },
        companyAddressLine2: {
            type: String,
            required: false,

        },
        city: {
            type: String,
            required: false,

        },
        pinCode: {
            type: String,
            required: false,

        },
    },
    organizationTaxDetails: {
        PAN: {
            type: String,
            required: false,
        },
        TAN: {
            type: String,
            required: false,
        },
        TDSCode: {
            type: String,
            required: false,
        },
        taxPaymentFrequency: {
            type: String,
            enum: ['MONTHLY', 'QUARTERLY', 'ANNUALLY'],
            required: false,
        },
    },
    payrollSettings: {
        isEditable: {
            type: Boolean,
            default: true
        },
        selectWorkingDays: {
            type: [String],
            required: false,
        },
        calculateSalaryBasedOn: {
            type: String,
            enum: ['ACTUALDAYS', 'COMPANYWORKINGDAYS'],
            required: false,
        },
        payrollFrom: {
            type: String,
            required: false,
        },
        payEmployeeOn: {
            type: String,
            required: false,
        },
        salaryCycleDay:{
            type: Number,
            required: false,
            default: 1
        }
    },
    bankDetails: {
        bankName: {
            type: String,
            required: false,
        },
        accountNumber: {
            type: String,
            required: false,
        },
        accountHolderName: {
            type: String,
            required: false,
        },
        ifscCode: {
            type: String,
            required: false,
        },
        branchAddress: {
            type: String,
            required: false,
        }
    },

}, { timestamps: true });

organizationSettingsSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

const OrganizationSettings = mongoose.model('OrganizationSettings', organizationSettingsSchema, 'organizationsettings');

module.exports = OrganizationSettings;
