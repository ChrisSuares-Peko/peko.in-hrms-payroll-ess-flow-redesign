/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const credential = sequelizeConfig.define("credential", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
    unique: true,
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

// Generate and hash password token
credential.prototype.getResetPasswordToken = function (expireTimeInMinutes = 10) {
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetPasswordExpire = Date.now() + expireTimeInMinutes * 60 * 1000;

  return {
    resetToken,
    resetPasswordToken,
    resetPasswordExpire,
  };
};

credential.hashPassword = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};
credential.prototype.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};
credential.prototype.validatePasswords = function (password, length) {
  // Ensure passwordHistory has a valid structure before accessing properties
  if (!this.passwordHistory || !this.passwordHistory.previousPasswords) return false;

  if (!length) length = this.passwordHistory.previousPasswords.length;
  if (bcrypt.compareSync(password, this.passwordHistory.currentPassword || this.password)) {
    return true;
  }
  for (
    let i = this.passwordHistory.previousPasswords.length - length;
    i < this.passwordHistory.previousPasswords.length;
    i++
  ) {
    if (this.passwordHistory.previousPasswords[i]) {
      if (bcrypt.compareSync(password, this.passwordHistory.previousPasswords[i])) {
        return true;
      }
    }
  }
  return false;
};


module.exports = credential;
