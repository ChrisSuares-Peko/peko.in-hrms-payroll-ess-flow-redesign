'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoiceGuidelines', 'registeredBy', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
            after: 'status',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoiceGuidelines', 'registeredBy');
    },
};
