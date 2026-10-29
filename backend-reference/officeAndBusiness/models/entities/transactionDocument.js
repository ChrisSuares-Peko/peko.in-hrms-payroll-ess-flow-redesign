"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

// A document (receipt/proof) attached to a bank transaction, stored in Firebase.
const transactionDocument = sequelizeConfig.define(
    "transactionDocuments",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        corporateUserId: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
        accountingTransactionId: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        documentName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        documentUrl: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        mimeType: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        fileSize: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        uploadedBy: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        indexes: [{ fields: ["accountingTransactionId"] }, { fields: ["corporateUserId"] }],
    }
);

module.exports = transactionDocument;
