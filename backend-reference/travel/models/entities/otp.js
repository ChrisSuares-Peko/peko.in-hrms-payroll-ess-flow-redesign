/**
 * Created by Umair
 */

const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const bcrypt = require("bcryptjs");

const OTP = sequelizeConfig.define("OTP", {
    pin: Sequelize.STRING,
    mobile: Sequelize.STRING,
    emailOtp: Sequelize.STRING,
    used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});

OTP.hashPin = function (pin) {
    return bcrypt.hashSync(pin, bcrypt.genSaltSync(10), null);
};
OTP.prototype.validatePin = function (pin) {
    return bcrypt.compareSync(pin, this.pin);
};
OTP.prototype.validateEmail = function (emailOtp) {
    return bcrypt.compareSync(emailOtp, this.emailOtp);
};

module.exports = OTP
