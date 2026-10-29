const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");


const payrollCategory = sequelizeConfig.define('payrollCategory', {
   
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    categoryName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
   
    categoryStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
});


module.exports = payrollCategory;