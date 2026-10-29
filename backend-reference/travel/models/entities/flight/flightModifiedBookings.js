"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const transaction = require("../transaction");
const order = require("../order");

const SubCorporateUser = require("../subCorporateUsers");

const flightModifiedBookings = sequelizeConfig.define("flightModifiedBookings", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    modificationStatus: {
        // 'NOT_AVAILABLE', 'MODIFICATION_REQUESTED', 'MODIFICATION_QUOTE_RECEIVED', 'MODIFICATION_PAYMENT_COMPLETED', 
        // 'TICKETED', 'MODIFICATION_REJECTED', 'REQUESTED_FOR_CANCELLATION', 'CANCELLED_AND_REFUNDED'
        type: Sequelize.STRING,
        defaultValue: 'NOT_AVAILABLE'
    },

    //------for modification track-------------------
    modificationRequestedJourney: {   // store user modification request
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [] // journey, reqDate
    },
    modificationRequestedDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },

    additionalPayment: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
    },
    adminComments: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    paymentLinkId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    paymentLinkUrl: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    paymentLinkExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
    },

    modifiedDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    flightTicketDoc: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    flightTicketPNR: {
        type: Sequelize.STRING,
        allowNull: true,
    },


    // for cancellation - modified booking
    cancellationDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    refundedAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
    }


});

flightModifiedBookings.belongsTo(transaction)
flightModifiedBookings.belongsTo(order)
flightModifiedBookings.belongsTo(credential)
flightModifiedBookings.belongsTo(SubCorporateUser)

module.exports = flightModifiedBookings;