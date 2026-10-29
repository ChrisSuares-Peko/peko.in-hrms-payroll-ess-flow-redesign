const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const credential = sequelizeConfig.define("credential", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    username: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    registeredBy: {
        type: Sequelize.STRING,
        allowNull: true,
    },
});

module.exports = credential;
