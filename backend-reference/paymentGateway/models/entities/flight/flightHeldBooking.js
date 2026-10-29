"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");

// Mirror of travel/models/entities/flight/flightHeldBooking.js, which owns this schema.
// Every service runs sequelize.sync({ force: false }) on boot, so whichever starts first on a
// fresh DB creates the table from its own model — the full column set must be declared here too.
//
// This service only closes a hold out (status -> CONSUMED) once its leg has ticketed.
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
    matchHash: {
        type: Sequelize.STRING(64),
        allowNull: true,
    },
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
}, {
    tableName: 'flightHeldBookings',
});

module.exports = flightHeldBooking;
