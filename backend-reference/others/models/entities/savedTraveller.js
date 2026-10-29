const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const credential = require('./credential');

const savedTraveller = sequelizeConfig.define('savedTraveller', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    subCorporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    title: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    firstName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    gender: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    paxType: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    passportNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    passportExpiry: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    passportIssueDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    passportIssueCountryCode: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    addressLine1: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    addressLine2: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    city: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    cellCountryCode: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '+91',
    },
    contactNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    nationality: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'IN',
    },
    countryCode: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'IN',
    },
    countryName: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'India',
    },
    pan: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE',
    },
});

savedTraveller.belongsTo(credential); // creates credentialId FK

module.exports = savedTraveller;
