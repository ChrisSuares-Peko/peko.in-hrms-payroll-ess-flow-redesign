'use strict'
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../../configs/database/index");
const garage_driver = require('./garage_driver');
const garage_fleet = require('./garage_fleet')

const garage_assignment = sequelizeConfig.define('garage_assignment', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    vehicleId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    driverId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    assignmentType: {
        type: Sequelize.ENUM('Assigned', 'Reassigned', 'Unassigned'),
        allowNull: false,
        defaultValue: 'Assigned'
    },
    assignedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});

garage_assignment.belongsTo(garage_fleet, { foreignKey: 'vehicleId' });
garage_assignment.belongsTo(garage_driver, { foreignKey: 'driverId' });
module.exports = garage_assignment;