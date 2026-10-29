const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const govtServiceApplication = require('./govtServiceApplication')

const govtServiceApplicationDocument = sequelizeConfig.define('govtServiceApplicationDocuments', {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  fieldKey: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fileKey: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  fileFormat: {
    type: Sequelize.STRING,
    allowNull: true
  }
})

govtServiceApplicationDocument.belongsTo(govtServiceApplication)

module.exports = govtServiceApplicationDocument
