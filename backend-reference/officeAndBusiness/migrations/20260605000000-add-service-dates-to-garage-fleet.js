'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('garage_fleets');
        } catch (err) {
            return;
        }
        if (!table.lastServiceDate) {
            await queryInterface.addColumn('garage_fleets', 'lastServiceDate', {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            });
        }
        if (!table.nextServiceDue) {
            await queryInterface.addColumn('garage_fleets', 'nextServiceDue', {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            });
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('garage_fleets');
        } catch (err) {
            return;
        }
        if (table.lastServiceDate) {
            await queryInterface.removeColumn('garage_fleets', 'lastServiceDate');
        }
        if (table.nextServiceDue) {
            await queryInterface.removeColumn('garage_fleets', 'nextServiceDue');
        }
    },
};
