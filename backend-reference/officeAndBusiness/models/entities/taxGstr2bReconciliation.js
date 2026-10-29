'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const TaxGstr2bReconciliation = sequelizeConfig.define('tax_gstr2b_reconciliations', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  corporateUserId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
  },
  gstin: {
    type: Sequelize.STRING(20),
    allowNull: false,
  },
  financialYear: {
    type: Sequelize.STRING(10),
    allowNull: false,
  },
  month: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM('reconciled'),
    allowNull: false,
    defaultValue: 'reconciled',
  },
  reconciledAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['corporateUserId', 'gstin', 'financialYear', 'month'],
      name: 'uq_gstr2b_reconciliation',
    },
  ],
});

module.exports = TaxGstr2bReconciliation;
