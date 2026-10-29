'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const ProcureEmployee = sequelizeConfig.define(
  'procureEmployee',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    corporateUserId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    employeeCode: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    fullName: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING(30),
      allowNull: true,
    },
    department: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    designation: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('ACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    meta: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: 'procure_employees',
    paranoid: true,
    underscored: false,
  }
);

module.exports = ProcureEmployee;
