'use strict';

// Multi-currency: for a non-INR invoice, subtotal/tax/discount/totalAmount/amountDue/
// amountPaid get recomputed to an INR-equivalent (via conversionRate) so internal
// stats/dashboards/aging stay comparable across currencies. These original* columns
// preserve the as-entered foreign-currency figures for display — PDF/UI must never
// show the INR-converted numbers to the customer. Ported from Peko-AE's pattern.
const COLUMNS = ['originalSubtotal', 'originalTax', 'originalDiscount', 'originalTotalAmount', 'originalAmountPaid', 'originalAmountDue'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');

    for (const column of COLUMNS) {
      if (!tableDesc[column]) {
        await queryInterface.addColumn('invoicings', column, {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
          defaultValue: null,
        });
      }
    }
  },

  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('invoicings');

    for (const column of COLUMNS) {
      if (tableDesc[column]) {
        await queryInterface.removeColumn('invoicings', column);
      }
    }
  },
};
