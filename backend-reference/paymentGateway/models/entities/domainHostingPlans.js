const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const domainHostingPlans = sequelizeConfig.define("domainHostingPlans", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    planType: {
        type: Sequelize.STRING,
    },
    planName: Sequelize.STRING,
    productId: Sequelize.STRING,
    planId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    billingCycle: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    description: Sequelize.TEXT,
    features: Sequelize.TEXT,
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    commissionMode: {
        type: Sequelize.ENUM("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP"),
        defaultValue: "MARGIN",
    },
    commissionType: {
        type: Sequelize.STRING,
        defaultValue: "PERCENTAGE",
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
});

module.exports = domainHostingPlans;
