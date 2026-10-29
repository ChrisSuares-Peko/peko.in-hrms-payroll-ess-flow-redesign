'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const CtrlPayConnection = sequelizeConfig.define('ctrlPayConnection', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
    },
    connectedBy: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    subject: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.ENUM('CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'),
        allowNull: false,
        defaultValue: 'CONNECTED',
    },
    idToken: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    idTokenExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    pan: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    mobile: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    partnerCodeTaggedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    walletLiveAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    dashboardEnteredAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
}, {
    indexes: [{ name: 'ctrlPayConnections_subject', fields: ['subject'] }],
});

module.exports = CtrlPayConnection;
