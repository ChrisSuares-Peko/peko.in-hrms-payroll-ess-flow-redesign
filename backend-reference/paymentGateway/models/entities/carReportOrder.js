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
        // Never written here — this service only creates the BUILDING order. Declared so
        // sequelize.sync({force:false}) agrees with officeAndBusiness, which owns the
        // column and fills it when the report is first opened.
        historyResult: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        // { slot1, slot2?, address } for a doorstep inspection. Written here too — unlike
        // historyResult this is pure form input, so the Cashfree leg captures it at
        // purchase; only the Droom dispatch is left to officeAndBusiness.
        inspectionBooking: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        // Never written here — officeAndBusiness fills these when Droom's async PaaS
        // report (the Valuation PDF) completes. Declared so sequelize.sync agrees.
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
