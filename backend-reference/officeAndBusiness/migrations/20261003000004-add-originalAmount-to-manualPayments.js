'use strict';

// Mirrors invoicings.original*: for a payment against a foreign-currency invoice,
// `amount` holds the INR-equivalent (for payment stats), `originalAmount` preserves
// what was actually entered/paid in the invoice's own currency.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('manualPayments');

    if (!tableDesc.originalAmount) {
      await queryInterface.addColumn('manualPayments', 'originalAmount', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('manualPayments');

    if (tableDesc.originalAmount) {
      await queryInterface.removeColumn('manualPayments', 'originalAmount');
    }
  },
};
