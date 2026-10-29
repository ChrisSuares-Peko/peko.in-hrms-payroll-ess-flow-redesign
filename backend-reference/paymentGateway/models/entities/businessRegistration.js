'use strict';

const Sequelize = require('sequelize');

const sequelizeConfig = require('../../configs/database/index');

// Minimal mirror of the officeAndBusiness `businessRegistrations` table — the
// payment gateway shares the same DB and only needs to read the amount and mark
// a paid draft. DB sync runs with { force:false } and no `alter`, so this
// partial model never creates or alters the (already-existing) table.
const businessRegistration = sequelizeConfig.define('businessRegistration', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    applicationId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    entityType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING',
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
});

module.exports = businessRegistration;
