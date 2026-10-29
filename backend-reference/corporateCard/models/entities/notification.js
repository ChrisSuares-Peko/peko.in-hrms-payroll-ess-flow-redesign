const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const notifications = sequelizeConfig.define('notifications', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    notificationTitle: Sequelize.STRING,
    notificationBrief: Sequelize.TEXT,
    notificationCategory: Sequelize.STRING,
    notificationTo: Sequelize.STRING,
    notificationBy: Sequelize.STRING,
    flag: {
        type: Sequelize.BOOLEAN,
        defaultValue: 0,
    },
})

module.exports = notifications
