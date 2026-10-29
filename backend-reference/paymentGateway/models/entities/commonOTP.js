const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const bcrypt = require("bcryptjs");

const commonOTP = sequelizeConfig.define("commonOTP", {
    contact: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    otp: Sequelize.STRING,
    expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    }
});

commonOTP.hashOtp = function (otp) {
    return bcrypt.hashSync(otp, bcrypt.genSaltSync(10), null);
};

commonOTP.prototype.validateOtp = async function (otp) {
    // Ensure expiresAt is a Date object for proper comparison
    const expiresAtDate = this.expiresAt instanceof Date ? this.expiresAt : new Date(this.expiresAt);
    const currentDateTime = new Date();
    
    if (expiresAtDate < currentDateTime) {
        throw new Error("The OTP is either invalid or expired");
    }

    // if (this.used) {
    //     throw new Error('OTP has already been used!');
    // }
    //// otp is already get expired on time

    const isOtpValid = bcrypt.compareSync(otp, this.otp);

    // Mark the OTP as used if it's valid
    if (isOtpValid) {
        this.used = true;
        await this.save(); // Save the updated 'used' status to the database
    }

    return isOtpValid;
};


module.exports = commonOTP;