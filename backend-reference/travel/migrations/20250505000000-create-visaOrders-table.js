'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        if (tables.includes('visaOrders')) return;

        await queryInterface.createTable('visaOrders', {
            id: {
                type: Sequelize.BIGINT,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            orderNumber: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            corporateTxnId: {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true,
            },
            productId: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            productName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            amountInINR: {
                type: Sequelize.DECIMAL(12, 4),
                defaultValue: 0.0,
            },
            baseCurrency: {
                type: Sequelize.STRING,
                defaultValue: 'INR',
            },
            adult: {
                type: Sequelize.INTEGER,
                defaultValue: 1,
            },
            child: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            infant: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            travelDate: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            applicants: {
                type: Sequelize.JSON,
                allowNull: true,
            },
            orderResponse: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            paymentStatus: {
                type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
                defaultValue: 'PENDING',
            },
            applicationStatus: {
                type: Sequelize.STRING,
                defaultValue: 'NEW',
            },
            transactionDate: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
            },
            // Foreign keys
            credentialId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'credentials',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            serviceOperatorId: {
                type: Sequelize.BIGINT,
                allowNull: true,
                references: {
                    model: 'serviceOperators',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
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

        // Index for fast lookups by user and status
        await queryInterface.addIndex('visaOrders', ['credentialId'], { name: 'idx_visaOrders_credentialId' });
        await queryInterface.addIndex('visaOrders', ['orderNumber'], { name: 'idx_visaOrders_orderNumber' });
        await queryInterface.addIndex('visaOrders', ['paymentStatus'], { name: 'idx_visaOrders_paymentStatus' });
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('visaOrders')) return;

        await queryInterface.dropTable('visaOrders');
    },
};
