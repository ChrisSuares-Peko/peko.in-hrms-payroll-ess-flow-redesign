'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let exists = true;
        try {
            await queryInterface.describeTable('businessRegistrationCatalogs');
        } catch (err) {
            exists = false;
        }
        if (exists) {
            return;
        }
        await queryInterface.createTable('businessRegistrationCatalogs', {
            id: {
                type: Sequelize.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            vendorCatalogId: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            serviceId: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            serviceName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            variantName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            marketPrice: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            vendorPrice: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            governmentFeeAmount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
            },
            unit: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            currency: {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: 'INR',
            },
            about: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            vendorData: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true,
            },
            status: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            sortOrder: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
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

        await queryInterface.addIndex('businessRegistrationCatalogs', ['serviceId']);
    },

    async down(queryInterface) {
        let exists = true;
        try {
            await queryInterface.describeTable('businessRegistrationCatalogs');
        } catch (err) {
            exists = false;
        }
        if (exists) {
            await queryInterface.dropTable('businessRegistrationCatalogs');
        }
    },
};
