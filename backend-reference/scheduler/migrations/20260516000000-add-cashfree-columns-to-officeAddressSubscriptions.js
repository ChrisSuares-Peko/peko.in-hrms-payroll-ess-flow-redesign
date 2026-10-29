"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const tableDesc = await queryInterface.describeTable("officeAddressSubscriptions");

            if (!tableDesc.vendorSubscriptionId) {
                await queryInterface.addColumn("officeAddressSubscriptions", "vendorSubscriptionId", {
                    type: Sequelize.STRING,
                    allowNull: true,
                });
                await queryInterface.addIndex("officeAddressSubscriptions", ["vendorSubscriptionId"], {
                    name: "idx_officeAddressSubs_vendorSubscriptionId",
                });
                console.log("[Migration] Added vendorSubscriptionId to officeAddressSubscriptions");
            }

            if (!tableDesc.corporateTxnId) {
                await queryInterface.addColumn("officeAddressSubscriptions", "corporateTxnId", {
                    type: Sequelize.STRING,
                    allowNull: true,
                });
            }

            if (!tableDesc.authPayment) {
                await queryInterface.addColumn("officeAddressSubscriptions", "authPayment", {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                });
            }

            if (!tableDesc.isGracePeriod) {
                await queryInterface.addColumn("officeAddressSubscriptions", "isGracePeriod", {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                });
                await queryInterface.addIndex("officeAddressSubscriptions", ["isGracePeriod"], {
                    name: "idx_officeAddressSubs_isGracePeriod",
                });
            }

            if (!tableDesc.serviceOperatorId) {
                await queryInterface.addColumn("officeAddressSubscriptions", "serviceOperatorId", {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                });
            }
        } catch (error) {
            console.error("[Migration] Failed to add Cashfree columns to officeAddressSubscriptions:", error.message);
            throw error;
        }
    },

    async down(queryInterface) {
        try {
            const tableDesc = await queryInterface.describeTable("officeAddressSubscriptions");
            for (const col of ["serviceOperatorId", "isGracePeriod", "authPayment", "corporateTxnId", "vendorSubscriptionId"]) {
                if (tableDesc[col]) {
                    await queryInterface.removeColumn("officeAddressSubscriptions", col);
                }
            }
        } catch (error) {
            console.error("[Migration] Failed to remove Cashfree columns from officeAddressSubscriptions:", error.message);
            throw error;
        }
    },
};
