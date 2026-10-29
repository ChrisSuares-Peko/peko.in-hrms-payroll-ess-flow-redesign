const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const setting = sequelizeConfig.define('setting', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
    details: { type: Sequelize.JSON, allowNull: true },
})

module.exports = setting
