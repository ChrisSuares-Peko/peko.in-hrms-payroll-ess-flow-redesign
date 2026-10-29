'use strict';

// Add-New-Customer form only ever collected primaryCountry (locked to 'India') — the
// Shipping Address section had no country field or column at all, blocking non-Indian
// shipping addresses. Guarded so it's a no-op if the column already exists.
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('invoiceCustomerV2s').catch(() => null);
    if (!tableDesc) return;

    if (!tableDesc.shippingCountry) {
      await queryInterface.addColumn('invoiceCustomerV2s', 'shippingCountry', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'India',
        after: 'shippingPincode',
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('invoiceCustomerV2s').catch(() => null);
    if (!tableDesc) return;

    if (tableDesc.shippingCountry) {
      await queryInterface.removeColumn('invoiceCustomerV2s', 'shippingCountry');
    }
  },
};
