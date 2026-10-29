"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const tableDesc = await queryInterface.describeTable("pekoWorksSubscriptions");

            if (!tableDesc.vendorSubscriptionId) {
                await queryInterface.addColumn("pekoWorksSubscriptions", "vendorSubscriptionId", {
                    type: Sequelize.STRING,
                    allowNull: true,
                });
                await queryInterface.addIndex("pekoWorksSubscriptions", ["vendorSubscriptionId"], {
                    name: "idx_pekoWorksSubs_vendorSubscriptionId",
                });
                console.log("[Migration] Added vendorSubscriptionId to pekoWorksSubscriptions");
            }

            if (!tableDesc.corporateTxnId) {
                await queryInterface.addColumn("pekoWorksSubscriptions", "corporateTxnId", {
                    type: Sequelize.STRING,
                    allowNull: true,
                });
            }

            if (!tableDesc.authPayment) {
                await queryInterface.addColumn("pekoWorksSubscriptions", "authPayment", {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                });
            }

            if (!tableDesc.isGracePeriod) {
                await queryInterface.addColumn("pekoWorksSubscriptions", "isGracePeriod", {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                });
                await queryInterface.addIndex("pekoWorksSubscriptions", ["isGracePeriod"], {
                    name: "idx_pekoWorksSubs_isGracePeriod",
                });
            }

            if (!tableDesc.serviceOperatorId) {
                await queryInterface.addColumn("pekoWorksSubscriptions", "serviceOperatorId", {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                });
            }
        } catch (error) {
            console.error("[Migration] Failed to add Cashfree columns to pekoWorksSubscriptions:", error.message);
            throw error;
        }
    },

    async down(queryInterface) {
        try {
            const tableDesc = await queryInterface.describeTable("pekoWorksSubscriptions");
            for (const col of ["serviceOperatorId", "isGracePeriod", "authPayment", "corporateTxnId", "vendorSubscriptionId"]) {
                if (tableDesc[col]) {
                    await queryInterface.removeColumn("pekoWorksSubscriptions", col);
                }
            }
        } catch (error) {
            console.error("[Migration] Failed to remove Cashfree columns from pekoWorksSubscriptions:", error.message);
            throw error;
        }
    },
};
