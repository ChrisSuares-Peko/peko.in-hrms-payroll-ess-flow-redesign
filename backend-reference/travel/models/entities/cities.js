/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const cities = sequelizeConfig.define("city", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    cityName: Sequelize.STRING,
    countryName: Sequelize.STRING
});
module.exports = cities;