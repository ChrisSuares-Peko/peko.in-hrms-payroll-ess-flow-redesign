'use strict';

// Customer-level currency, ported from Peko-AE's invoiceCustomer. Lets an invoice auto-fill
// its currency from the selected customer instead of always defaulting to INR.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoiceCustomerV2s');
    if (!tableDesc.currency) {
      await queryInterface.addColumn('invoiceCustomerV2s', 'currency', {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
      });
    }
  },

  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('invoiceCustomerV2s');
    if (tableDesc.currency) {
      await queryInterface.removeColumn('invoiceCustomerV2s', 'currency');
    }
  },
};
