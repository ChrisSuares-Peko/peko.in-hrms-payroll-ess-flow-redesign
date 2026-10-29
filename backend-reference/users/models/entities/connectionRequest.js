'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const connectionRequest = sequelizeConfig.define('connection_request', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    senderId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    receiverId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    message: Sequelize.STRING,
})



module.exports = connectionRequest