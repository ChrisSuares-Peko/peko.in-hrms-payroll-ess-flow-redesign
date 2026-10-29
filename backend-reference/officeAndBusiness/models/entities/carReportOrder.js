'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// One row per purchased Car Report (Droom MYBIZ), 1:1 with the shared `orders` row via
// corporateTxnId. No association is declared: `orders` associates on its `id` PK, not on
// corporateTxnId, so the join is done explicitly in the controller.
//
// `valuationBands` is a point-in-time snapshot of what the user was shown before paying.
// It is never refreshed — re-asking Droom could return different numbers, and the order
// must stand against the price the customer actually agreed to.
const carReportOrder = sequelizeConfig.define(
    'carReportOrder',
    {
        id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        corporateTxnId: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        credentialId: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        subCorporateUserId: {
            type: Sequelize.BIGINT,
            allowNull: true,
        },
        reportType: {
            type: Sequelize.STRING(20),
            allowNull: false,
        },
        reportName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        vehicleNumber: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        vehicleModel: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        bodyType: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        isManualVehicle: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        amount: {
            type: Sequelize.DECIMAL(12, 4),
            defaultValue: 0,
        },
        paymentMode: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        orderDate: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        reportStatus: {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: 'BUILDING',
        },
        valuationBands: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        valuationSpec: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        // Normalised Vehicle History result, written when a BUILDING history order is
        // first opened (controllers/corporate/carReportHistory.js). The raw vendor body
        // goes to vendorResponse below.
        historyResult: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        // { slot1, slot2?, address } for a doorstep inspection. Pure input, captured at
        // purchase — Droom returns no booking body, so unlike historyResult there is
        // nothing to fetch back. See controllers/corporate/carReportInspection.js.
        inspectionBooking: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        // Where the finished Valuation PDF lives, written when Droom's async PaaS report
        // completes (webhook or read-time status poll). `reportUrl` is the vendor CDN
        // link the customer downloads; `reportPath` the vendor-relative path.
        reportUrl: {
            type: Sequelize.STRING(500),
            allowNull: true,
        },
        reportPath: {
            type: Sequelize.STRING(500),
            allowNull: true,
        },
        formValues: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        vendorReference: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        vendorResponse: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        indexes: [
            { unique: true, fields: ['corporateTxnId'] },
            { fields: ['credentialId', 'orderDate'] },
        ],
    }
);

module.exports = carReportOrder;
