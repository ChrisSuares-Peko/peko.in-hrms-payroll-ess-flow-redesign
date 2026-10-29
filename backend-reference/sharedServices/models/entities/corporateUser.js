const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const corporateUser = sequelizeConfig.define("corporateUser", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    registeredBy: {
        type: Sequelize.STRING,
        allowNull: true,
    },
});

module.exports = corporateUser;
