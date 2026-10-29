'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const desc = await queryInterface.describeTable('users');

        if (!desc.cardRole) {
            await queryInterface.addColumn('users', 'cardRole', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!desc.cardStatus) {
            await queryInterface.addColumn('users', 'cardStatus', {
                type: Sequelize.ENUM('PENDING', 'ACTIVE', 'INACTIVE'),
                allowNull: true,
            });
        }

        if (!desc.isDeleted) {
            await queryInterface.addColumn('users', 'isDeleted', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }

        if (!desc.services) {
            await queryInterface.addColumn('users', 'services', {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }

        const indexes = await queryInterface.showIndex('users');
        if (!indexes.some((index) => index.name === 'users_corporateUserId_cardStatus_idx')) {
            await queryInterface.addIndex('users', ['corporateUserId', 'cardStatus'], {
                name: 'users_corporateUserId_cardStatus_idx',
            });
        }
    },

    async down(queryInterface) {
        const indexes = await queryInterface.showIndex('users');
        if (indexes.some((index) => index.name === 'users_corporateUserId_cardStatus_idx')) {
            await queryInterface.removeIndex('users', 'users_corporateUserId_cardStatus_idx');
        }

        const desc = await queryInterface.describeTable('users');
        if (desc.services) await queryInterface.removeColumn('users', 'services');
        if (desc.isDeleted) await queryInterface.removeColumn('users', 'isDeleted');
        if (desc.cardStatus) await queryInterface.removeColumn('users', 'cardStatus');
        if (desc.cardRole) await queryInterface.removeColumn('users', 'cardRole');
    },
};
