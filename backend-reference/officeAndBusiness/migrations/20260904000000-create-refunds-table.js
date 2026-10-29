'use strict';

// New table for tracking cash refunded back to a customer when a Credit Note is issued
// against an invoice that was already paid (fully or partially). Guarded so this is safe
// to run whether or not sequelize.sync() already created it.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('refunds');
    if (tableExists) return;

    await queryInterface.createTable('refunds', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      receiptNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoiceId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      creditNoteId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      corporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      refundMode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      refundDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      referenceId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('refunds');
  },
};
