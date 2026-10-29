const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const Package = require("./package");
const ServiceOperatorId = require("./serviceOperator");
const ReferralCodes = require("./referral_codes");
const PekoCredits = sequelizeConfig.define("peko_credits", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    discountType: {
        type: Sequelize.ENUM("FLAT", "PERCENTAGE"),
        defaultValue: "FLAT",
        allowNull: false,
    },
    billingType: {
        type: Sequelize.ENUM("MONTHLY", "ANNUALLY"),
    },
    discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM("ACTIVE", "DISABLED"),
        defaultValue: "ACTIVE",
        allowNull: false,
    },
    expiryDays: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    partnerId: Sequelize.STRING,
    couponType: {
        type: Sequelize.ENUM("SUBSCRIPTION", "SERVICES"),
        defaultValue: "SERVICES",
        allowNull: false,
    },
    minimumPurchase: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
    },
    maximumDiscount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
    },
    validUntil: {
        type: Sequelize.DATE,
        allowNull: false
    },
});

PekoCredits.belongsTo(Package);
PekoCredits.belongsTo(ServiceOperatorId);
PekoCredits.belongsTo(ReferralCodes);
module.exports = PekoCredits;
