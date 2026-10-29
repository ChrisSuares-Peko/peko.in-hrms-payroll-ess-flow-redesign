"use strict";

const TABLE = "serviceApprovals";

module.exports = {
    async up(queryInterface, Sequelize) {
        if (await queryInterface.tableExists(TABLE)) return;

        await queryInterface.createTable(TABLE, {
            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            partnerPermissionId: { type: Sequelize.BIGINT, allowNull: false },
            registeredBy: { type: Sequelize.STRING, allowNull: true },
            approvals: { type: Sequelize.JSON, allowNull: false },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex(TABLE, ["partnerPermissionId"], {
            unique: true,
            name: "serviceApprovals_partnerPermissionId_unique",
        });
    },

    async down(queryInterface) {
        if (await queryInterface.tableExists(TABLE)) await queryInterface.dropTable(TABLE);
    },
};
