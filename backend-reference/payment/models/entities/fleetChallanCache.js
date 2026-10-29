'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Cache of Droom challans per Turbo fleet vehicle. The fleet view reads these rows instead of
// calling Droom get-challan per vehicle on every load; rows are refreshed on demand when stale.
const fleetChallanCache = sequelizeConfig.define(
    'fleetChallanCache',
    {
        id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        credentialId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        vehicleNumber: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        challans: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        lastFetchedAt: {
            type: Sequelize.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        indexes: [{ unique: true, fields: ['credentialId', 'vehicleNumber'] }],
    }
);

module.exports = fleetChallanCache;
