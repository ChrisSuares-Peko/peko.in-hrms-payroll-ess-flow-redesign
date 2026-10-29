const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential")

const connections = sequelizeConfig.define('connections', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    serviceProvider: Sequelize.STRING,
    name: Sequelize.STRING,
    mobile: Sequelize.STRING,
    email: Sequelize.STRING,
    preferredMode: Sequelize.STRING,
    requirement: Sequelize.STRING
})
connections.belongsTo(credential)
module.exports = connections