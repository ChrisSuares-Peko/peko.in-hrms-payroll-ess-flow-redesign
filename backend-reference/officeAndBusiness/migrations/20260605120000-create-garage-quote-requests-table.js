'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let exists = true;
        try {
            await queryInterface.describeTable('garage_quote_requests');
        } catch (err) {
            exists = false;
        }
        if (exists) {
            return;
        }
        await queryInterface.createTable('garage_quote_requests', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            fullName: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            mobileNumber: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            insuranceType: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            vehicleNumber: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            vehicleId: {
                type: Sequelize.BIGINT,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM('NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED'),
                allowNull: false,
                defaultValue: 'NEW',
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            credentialId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            subCorporateUserId: {
                type: Sequelize.BIGINT,
                allowNull: true,
            },
            isDeleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.NOW,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('garage_quote_requests', ['credentialId']);
        await queryInterface.addIndex('garage_quote_requests', ['status']);
    },

    async down(queryInterface) {
        let exists = true;
        try {
            await queryInterface.describeTable('garage_quote_requests');
        } catch (err) {
            exists = false;
        }
        if (exists) {
            await queryInterface.dropTable('garage_quote_requests');
        }
    },
};
