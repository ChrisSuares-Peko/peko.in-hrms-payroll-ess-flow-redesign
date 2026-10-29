"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const accountingSequences = sequelizeConfig.define("accountingSequences", {
    name: {
        type: Sequelize.STRING(16),
        primaryKey: true,
        allowNull: false,
    },
    lastValue: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
    },
});

module.exports = accountingSequences;
