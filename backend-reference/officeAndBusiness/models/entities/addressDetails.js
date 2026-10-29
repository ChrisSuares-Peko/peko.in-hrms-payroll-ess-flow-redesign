const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const credential = require('./credential');

const addressDetails = sequelizeConfig.define('addressDetails', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    nickname: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    department: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    city: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    country: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    state: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    addressLine1: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    addressLine2: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    countryCode: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    zipCode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    isReceiver: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    addressType: {
        type: Sequelize.STRING,
        allowNull: true,
    },
});

addressDetails.beforeCreate(async (address) => {
    const defaultAddress = await addressDetails.findOne({
        where: {
            credentialId: address.credentialId,
            default: true,
        },
    });
    if (!defaultAddress) {
        address.default = true;
    }
});

addressDetails.belongsTo(credential);

module.exports = addressDetails;
