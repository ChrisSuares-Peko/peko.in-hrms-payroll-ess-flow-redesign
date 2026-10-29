'use strict'
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../../configs/database/index");
const credential = require('../credential');

const garage_operations_log = sequelizeConfig.define('garage_operations_log', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    actionType: {
        type: Sequelize.ENUM(
            'RC_LOOKUP',
            'DL_LOOKUP',
            'ADD_VEHICLE',
            'ADD_DRIVER',
            'ASSIGN_DRIVER',
            'UNASSIGN_DRIVER',
            'UPLOAD_DOCUMENT',
            'DELETE_VEHICLE',
            'DELETE_DRIVER',
            'FASTAG_RECHARGE',
            'REASSIGN_DRIVER',
            'UPDATE_FASTAG',
            'UPDATE_SERVICE_DATES',
            'UPDATE_DOCUMENT',
            'DELETE_DOCUMENT',
            'REQUEST_QUOTE'
        ),
        allowNull: false
    },
    referenceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    meta: {
        type: Sequelize.JSON,
        allowNull: true
    },
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    updatedAt: {
        type: Sequelize.DATE
    }
});

garage_operations_log.belongsTo(credential);
module.exports = garage_operations_log;
