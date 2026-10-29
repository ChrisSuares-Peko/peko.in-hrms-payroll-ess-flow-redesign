'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoicings', 'recurringId', {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
            after: 'isCreditNoteCreated',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoicings', 'recurringId');
    },
};
