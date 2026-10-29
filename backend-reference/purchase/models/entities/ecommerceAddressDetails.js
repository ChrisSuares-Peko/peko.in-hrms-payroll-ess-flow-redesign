const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const credential = require('./credential');

const ecommerceAddressDetails = sequelizeConfig.define('ecommerceAddressDetails', {
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
    city: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    country: {
        type: Sequelize.STRING,
        defaultValue: 'India',
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
    zipCode: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
});

ecommerceAddressDetails.beforeCreate(async (address) => {
    const defaultAddress = await ecommerceAddressDetails.findOne({
        where: {
            credentialId: address.credentialId,
            default: true,
        },
    });
    if (!defaultAddress) {
        address.default = true;
    }
});

ecommerceAddressDetails.belongsTo(credential);

module.exports = ecommerceAddressDetails;
