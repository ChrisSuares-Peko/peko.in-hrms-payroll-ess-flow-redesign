/**
 * Created by Salmaan Mushtaq
 */
'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const vendor = require("./vendor")

const catergory = sequelizeConfig.define('category', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    categoryName: Sequelize.STRING,
    categoryImage: Sequelize.TEXT,
    categoryStatus:{
        type: Sequelize.BOOLEAN,
        defaultValue: true
      }
})
catergory.belongsTo(vendor)
module.exports = catergory