"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const transaction = require("../transaction");
const order = require("../order");

const SubCorporateUser = require("../subCorporateUsers");

const flightBooking = sequelizeConfig.define("flightBooking", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    customerInfo: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
    TraceId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    BookingId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    PNR: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    bookingStatus: {   // eg.TICKETED , BOOKING_FAILED, PENDING (OK TO TICKET), CANCELLED_REQUEST_FOR_REFUND, CANCELLED_AND_REFUNDED, MODIFIED (ie, all ticket details are void and fetch from new booking)
        type: Sequelize.STRING,
        allowNull: true,
    },
    // bookingCurrentStatus: {   // 'MODIFICATION_REQUESTED', 'MODIFICATION_QUOTE_RECEIVED', 'MODIFICATION_PAYMENT_COMPLETED','MODIFIED'
    //     type: Sequelize.STRING,
    //     defaultValue: 'NOT_AVAILABLE'
    // },

    journey: {       // store all flight journey and each segments in a journey
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    passengers: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    // ticketDocument: { // for each passengers
    //     type: Sequelize.JSON,
    //     allowNull: true,
    //     defaultValue: []
    // },
    fare: { // fare breakdown including tax details
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
    userContactDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    }
    // for cancellation main booking
    // cancellationDate: {
    //     type: Sequelize.DATE,
    //     allowNull: true,
    // },
    // refundedAmount: {
    //     type: Sequelize.DECIMAL(12, 2),
    //     allowNull: true,
    // }

});

flightBooking.belongsTo(credential)
flightBooking.belongsTo(transaction)
flightBooking.belongsTo(order)
flightBooking.belongsTo(SubCorporateUser);

module.exports = flightBooking;