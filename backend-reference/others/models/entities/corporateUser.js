/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const Package = require("./package");
const cart = require("./cart");
const invoices = require("./invoices");
const subscription = require("./subscription");

const corporateUser = sequelizeConfig.define("corporateUser", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: Sequelize.STRING,
    mobileNo: {
        type: Sequelize.STRING,
        unique: true
    },
    name: Sequelize.STRING,
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    designation: Sequelize.STRING,
    website: Sequelize.STRING,
    country: Sequelize.STRING,
    state: Sequelize.STRING,
    city: Sequelize.STRING,
    sector: Sequelize.STRING,
    poBox: Sequelize.STRING,
    countryCode: Sequelize.STRING,
    contactPersonName: Sequelize.STRING,
    companyName: Sequelize.STRING,
    companySize: Sequelize.STRING,
    contactPersonEmail: Sequelize.STRING,
    contactPersonPhone: Sequelize.STRING,
    tradeLicenseNo: Sequelize.STRING,
    activity: Sequelize.STRING,
    tradeLicenseExpiry: Sequelize.DATE,
    tradeLicenseDoc: Sequelize.STRING,
    trnCertificate: Sequelize.STRING,
    trnNo: Sequelize.STRING,
    issuingAuthority: Sequelize.STRING,
    referralCode: Sequelize.STRING,
    kycRemarks: Sequelize.TEXT,
    gstNumber: {
        type: Sequelize.STRING,
        unique: true
    },
    panNumber: {
        type: Sequelize.STRING,
        unique: true
    },
    panVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    gstVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    cinVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    kycStatus: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
    },
    latLng: Sequelize.STRING,
    logo: Sequelize.TEXT,
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    registeredBy: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    isMFA: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    sendMfaCodeToEmail: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    sendMfaCodeToPhone: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    sendMfaCodeToAuthApp: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    totpSecret: Sequelize.STRING,
    landlineNo: Sequelize.STRING,
    cinNumber: Sequelize.STRING,
    cinDoc: Sequelize.STRING,
    panDoc: Sequelize.STRING,
    tanDoc: Sequelize.STRING,
    gstDoc: Sequelize.STRING,
    mobileVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    emailVerified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
    monthlyReport: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
            email: [],
            isActive: false,
            scheduledTime: ""
        }
    },
    weeklyReport: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
            email: [],
            isActive: false,
            scheduledTime: ""
        }
    },
    dailyReport: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
            email: [],
            isActive: false,
            scheduledTime: ""
        }
    },
    productTour: {
        type: Sequelize.JSON,
        defaultValue: {
            dashboard: true
        }
    },
});
corporateUser.belongsTo(Package)
corporateUser.belongsTo(credential);
corporateUser.hasMany(subscription)
corporateUser.hasOne(cart)
corporateUser.hasOne(invoices)
module.exports = corporateUser;