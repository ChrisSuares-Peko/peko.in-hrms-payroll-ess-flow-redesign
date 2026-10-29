const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const CorporateUser = require("./corporateUser");
const SubscriptionCoupon = require("./pekoCredits");

const UserCoupons = sequelizeConfig.define("user_coupons", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    couponId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
            model: SubscriptionCoupon,
            key: "id",
        },
        onDelete: "SET NULL",
    },
    status: {
        type: Sequelize.ENUM("UNCLAIMED", "CLAIMED", "EXPIRED"),
        defaultValue: "UNCLAIMED",
        allowNull: false,
    },
    claimedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    expiryDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
    usedCouponData: {
        type: Sequelize.JSON,
        allowNull: true,
    }
});

UserCoupons.belongsTo(CorporateUser)
UserCoupons.belongsTo(SubscriptionCoupon, { foreignKey: "couponId", as: 'couponData' }); 

module.exports = UserCoupons;
