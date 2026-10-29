"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const SubCorporateUser = require("../subCorporateUsers");

// A non-LCC seat held via TBO /rest/Book but not yet ticketed.
const flightHeldBooking = sequelizeConfig.define("flightHeldBooking", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    subCorporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    // See utils/flightHoldFingerprint. Nullable: unfingerprintable holds are still recorded.
    matchHash: {
        type: Sequelize.STRING(64),
        allowNull: true,
    },
    // matchHash without fare class
    routeHash: {
        type: Sequelize.STRING(64),
        allowNull: true,
    },
    status: {   // HELD, CONSUMED, RELEASED, RELEASE_FAILED
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'HELD',
    },
    legType: {  // OUTBOUND, INBOUND
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'OUTBOUND',
    },
    groupKey: {
        type: Sequelize.STRING(64),
        allowNull: true,
    },
    PNR: {
        type: Sequelize.STRING(32),
        allowNull: true,
    },
    BookingId: {
        type: Sequelize.STRING(32),
        allowNull: true,
    },
    // TBO FlightItinerary.Source — mandatory on ReleasePNRRequest
    source: {
        type: Sequelize.STRING(16),
        allowNull: true,
    },
    traceId: {
        type: Sequelize.STRING(64),
        allowNull: true,
    },
    resultIndex: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    lastTicketDate: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    releaseAt: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    isPriceChanged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isTimeChanged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    fare: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
    passengerFares: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    segments: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    passengers: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    userContactDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
    releasedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    releaseError: {
        type: Sequelize.TEXT,
        allowNull: true,
    }
});

flightHeldBooking.belongsTo(credential)
flightHeldBooking.belongsTo(SubCorporateUser);

module.exports = flightHeldBooking;
