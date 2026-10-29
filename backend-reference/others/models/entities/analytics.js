const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const analytics = sequelizeConfig.define("analytics", {
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

module.exports = analytics;
