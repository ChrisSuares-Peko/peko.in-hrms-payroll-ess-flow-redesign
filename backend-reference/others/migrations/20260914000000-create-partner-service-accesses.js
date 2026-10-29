'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('partnerServiceAccesses', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            partnerId: {
                type: Sequelize.BIGINT,
                allowNull: false,
            },
            permissions: {
                type: Sequelize.JSON,
                allowNull: false,
            },
            status: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
        });

        await queryInterface.addIndex('partnerServiceAccesses', ['partnerId'], {
            unique: true,
            name: 'partner_service_accesses_partner_id_unique',
        });
        await queryInterface.addIndex('partnerServiceAccesses', ['partnerId', 'status']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('partnerServiceAccesses');
    },
};
