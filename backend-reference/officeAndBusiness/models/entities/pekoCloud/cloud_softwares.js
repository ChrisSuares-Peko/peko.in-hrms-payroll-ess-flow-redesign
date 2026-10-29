'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const SubCorporateUser = require('../subCorporateUsers');

const cloud_softwares = sequelizeConfig.define('cloud_softwares', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    name: Sequelize.STRING,
    image: Sequelize.STRING,
    status: {
        type:Sequelize.BOOLEAN,
        defaultValue:true
    },
})
cloud_softwares.belongsTo(SubCorporateUser)
module.exports = cloud_softwares