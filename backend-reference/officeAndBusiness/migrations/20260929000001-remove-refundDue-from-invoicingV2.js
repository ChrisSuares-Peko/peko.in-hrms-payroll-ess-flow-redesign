'use strict';

// Reverts 20260904000001-add-refundDue-to-invoicingV2: the refund-liability-tracking
// feature is being removed from invoices entirely.
module.exports = {
  up: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('invoicings');
    if (tableDesc.refundDue) {
      await queryInterface.removeColumn('invoicings', 'refundDue');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');
    if (!tableDesc.refundDue) {
      await queryInterface.addColumn('invoicings', 'refundDue', {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
        allowNull: true,
      });
    }
  },
};
