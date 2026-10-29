'use strict'

const Sequelize = require('sequelize')
const sequelize = require('../../configs/database/index')

const govtService = sequelize.define('govtServices', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  accessKey: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  category: {
    type: Sequelize.ENUM('Tax & Compliance', 'License & Permits'),
    allowNull: false
  },
  tag: {
    type: Sequelize.ENUM('Mandatory', 'Regulatory Dependent', 'Good-to-have'),
    allowNull: false
  },
  processingTime: {
    type: Sequelize.STRING,
    allowNull: true
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  govtFee: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  }
})

module.exports = govtService
