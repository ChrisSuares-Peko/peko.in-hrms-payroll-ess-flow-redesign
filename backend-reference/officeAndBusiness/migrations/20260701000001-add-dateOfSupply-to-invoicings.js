'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoicings', 'dateOfSupply', {
            type: Sequelize.DATEONLY,
            allowNull: true,
            defaultValue: null,
            after: 'dueDate',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoicings', 'dateOfSupply');
    },
};
