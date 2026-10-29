"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const PasswordPolicy = sequelizeConfig.define("PasswordPolicies", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  level: {
    type: Sequelize.INTEGER,
    allowNull: false,
    default: 1,
  },

  minLength: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },

  minPasswordAge: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  maxPasswordAge: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  minChangeChars: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },

  prohibitPasswordReuse: {
    type: Sequelize.BOOLEAN,
    default: false,
    // allowNull:true

    
  },

  prohibitPasswordReuseTimes: {
    type: Sequelize.INTEGER,
    // allowNull: true,
  },
 
  maxInvalidLoginAttempts: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  lockEffectivePeriod: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  lockoutTimespan: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  enableBannedPasswords: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    default:false
  },
  customBannedPasswords: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  
  preventPersonalDataInPassword: {
    type: Sequelize.BOOLEAN,
    default: false,
  },
});

module.exports = PasswordPolicy;
