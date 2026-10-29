"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");


const photos = sequelize.define("photos", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    productImageUrl: Sequelize.TEXT,
    imageField: Sequelize.TEXT

});

module.exports = photos;

