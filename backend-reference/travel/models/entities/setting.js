const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const setting = sequelizeConfig.define("setting", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING
    },
    details: {
        type: Sequelize.JSON,
        allowNull: true,
    }
});

module.exports = setting;
