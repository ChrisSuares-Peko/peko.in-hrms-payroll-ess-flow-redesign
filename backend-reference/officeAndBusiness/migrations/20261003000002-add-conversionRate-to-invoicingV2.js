'use strict';

// International invoice exchange rate: 1 <currency> = conversionRate INR.
// Ported from Peko-AE's conversionRate pattern. Default 1 covers existing
// (domestic, INR) rows on backfill.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');

    if (!tableDesc.conversionRate) {
      await queryInterface.addColumn('invoicings', 'conversionRate', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 1,
      });
    }
  },

  down: async (queryInterface) => {
    const tableDesc = await queryInterface.describeTable('invoicings');

    if (tableDesc.conversionRate) {
      await queryInterface.removeColumn('invoicings', 'conversionRate');
    }
  },
};
