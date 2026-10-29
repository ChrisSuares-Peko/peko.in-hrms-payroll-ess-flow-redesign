const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const credential = require('./credential')

const govtServiceApplication = sequelizeConfig.define('govtServiceApplications', {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  service: {
    type: Sequelize.STRING,
    allowNull: false
  },
  applicationNumber: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true
  },
  currentStep: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    allowNull: false
  },
  formData: {
    type: Sequelize.JSON,
    defaultValue: {},
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'REUPLOAD', 'APPROVED', 'REJECTED', 'COMPLETED'),
    defaultValue: 'DRAFT',  
    allowNull: false
  },
  remarks: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  submittedAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  completedAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  statusHistory: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: null
  },
  approvedDocument: {
    type: Sequelize.STRING(1000),
    allowNull: true
  }
})

govtServiceApplication.belongsTo(credential)

module.exports = govtServiceApplication
