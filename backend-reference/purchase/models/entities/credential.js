/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const { BCRYPT_SALT_ROUNDS } = require("../../utils/constants");
const credential = sequelizeConfig.define("credential", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  role: {
    type: Sequelize.ENUM(
      "CORPORATE",
      "SYSTEM_USER",
      "CORPORATE_SUB_USER",
      "ADMIN",
      "INVESTOR",
      "SUPPORT",
      "FINANCE",
      "PARTNER",
      "VENDOR",
      "ECOM_MANAGER",
      "USER",
    ),
  },
  username: {
    type: Sequelize.STRING,
    unique: true
  },
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.TEXT,
  passwordResetToken: Sequelize.STRING,
  passwordResetExpires: Sequelize.DATE,
  registeredBy: Sequelize.STRING,
  lastLogin: Sequelize.DATE,
  subPartnerId: Sequelize.STRING,
  passwordHistory: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  loginAttempts: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  lockPeriod: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  firstLoginAttempt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  passwordDate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  passwordProtection: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: true,
  },

});

//Generate and hash password token
credential.prototype.getResetPasswordToken = function () {
  //Generate the token
  const resetToken = crypto.randomBytes(20).toString('hex')

  //Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  //Set the expire
  const resetPasswordExpire = Date.now() + 24 * 60 * 60 * 1000;

  return {
    resetToken,
    resetPasswordToken,
    resetPasswordExpire
  }
}

credential.hashPassword = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(BCRYPT_SALT_ROUNDS), null);
};
credential.prototype.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};
credential.belongsTo(credential, { as: 'registeredByCredential', foreignKey: 'registeredBy' }); // added for getting partner name in reports admin side
module.exports = credential;