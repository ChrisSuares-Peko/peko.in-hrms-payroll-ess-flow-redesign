const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const transaction = sequelizeConfig.define("transaction", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    corporateTxnId: Sequelize.STRING,
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    journalRecordStatus: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    journalData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
});

module.exports = transaction;
