'use strict';

// Tracks how much cash is currently owed back to the customer for an invoice sitting at
// REFUND_DUE (a Credit Note credited more than what was still due, so the excess was
// already collected as a real payment). Decremented as refunds get recorded; the invoice
// flips to REFUNDED once this reaches 0.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');
    if (!tableDesc.refundDue) {
      await queryInterface.addColumn('invoicings', 'refundDue', {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('invoicings', 'refundDue');
  },
};
