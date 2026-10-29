'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const credential = require('../credential');
const SubCorporateUser = require('../subCorporateUsers');

const cloud_employees = sequelizeConfig.define('cloud_employees', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    employeeName: Sequelize.STRING,
    employeeID: Sequelize.TEXT,
    employeeEmail: Sequelize.TEXT,
    department: Sequelize.STRING,
    joiningDate: Sequelize.DATE,
    profilePicture: Sequelize.STRING,
    status: Sequelize.STRING,
})
cloud_employees.belongsTo(credential)
cloud_employees.belongsTo(SubCorporateUser)

module.exports = cloud_employees