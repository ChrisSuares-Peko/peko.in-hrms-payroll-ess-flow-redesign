const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const saved_cards = sequelizeConfig.define('saved_cards', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    cardToken: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    cardholderName: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    expiry: {
        type: Sequelize.STRING(7),
        allowNull: false
    },
    maskedPan: {
        type: Sequelize.STRING(20),
        allowNull: false
    },
    scheme: {
        type: Sequelize.STRING(50),
        allowNull: false
    },
    recaptureCsc: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    is_default: {
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
    },
})

module.exports = saved_cards