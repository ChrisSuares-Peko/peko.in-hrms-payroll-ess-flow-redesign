'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoicings', 'taxType', {
            type: Sequelize.ENUM('Intra-State', 'Inter-State'),
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoicings', 'taxType');
    },
};
