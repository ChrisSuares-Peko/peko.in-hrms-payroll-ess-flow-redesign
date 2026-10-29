'use strict';

// Cash sale: a walk-in customer with no record on an invoice. Ported from Peko-AE's
// invoicing module. name/email/phoneNumber become nullable since a cash-sale invoice
// may have none of them on file.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');

    if (!tableDesc.cashSale) {
      await queryInterface.addColumn('invoicings', 'cashSale', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    await queryInterface.changeColumn('invoicings', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('invoicings', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('invoicings', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('invoicings');

    if (tableDesc.cashSale) {
      await queryInterface.removeColumn('invoicings', 'cashSale');
    }

    await queryInterface.changeColumn('invoicings', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('invoicings', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn('invoicings', 'phoneNumber', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
