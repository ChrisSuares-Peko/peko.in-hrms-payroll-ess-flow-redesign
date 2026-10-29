const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const vendor = require("./vendor")

const category = sequelizeConfig.define('category', {
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
    categoryImage: Sequelize.TEXT,
    categoryStatus:{
        type:Sequelize.BOOLEAN,
        defaultValue:true
    }
});

category.belongsTo(vendor)
module.exports = category;