"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const signUpActivityLog = sequelizeConfig.define("signUpActivityLog", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    contactPersonName: Sequelize.STRING,
    companyName: Sequelize.STRING,
    email: Sequelize.STRING,
    mobileNo: Sequelize.STRING,
    referralCode:Sequelize.STRING,
    isPasswordCreated:{
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    isEmailOTPValidated:{
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    isMobileOTPValidated:{
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    status:{
        type: Sequelize.ENUM(
            "PENDING",
            "COMPLETED",
            "CLOSED"
        ),
        defaultValue: 'PENDING'
    },
    remarks: Sequelize.STRING(2000),
    partnerId:Sequelize.STRING
});

module.exports = signUpActivityLog;