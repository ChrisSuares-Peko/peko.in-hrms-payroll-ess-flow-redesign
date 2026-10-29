const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

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
  // Exposed here (Gov Services V2 payment) so the vendor payment/engagement
  // details (doc v1.1 §19) can be merged in without a migration — the column
  // already exists on the real table (see purchase's full entity).
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
  submittedAt: {
    type: Sequelize.DATE,
    allowNull: true
  },
  credentialId: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
})

module.exports = govtServiceApplication
