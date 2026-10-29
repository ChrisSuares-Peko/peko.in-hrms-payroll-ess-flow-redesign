const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const User = sequelizeConfig.define('user', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    mobileNo: Sequelize.STRING,
    corporateUserId: Sequelize.INTEGER,
    employeeId: Sequelize.STRING,
    userAccessService: {
        type: Sequelize.JSON,
        allowNull: true
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

User.belongsTo(credential);

module.exports = User
