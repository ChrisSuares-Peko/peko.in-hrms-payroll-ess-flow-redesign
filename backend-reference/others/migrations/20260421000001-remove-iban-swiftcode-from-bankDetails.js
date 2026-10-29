'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('bankDetails')) return;

    const tableDescription = await queryInterface.describeTable('bankDetails');

    if (tableDescription.bankAddress) {
      await queryInterface.changeColumn('bankDetails', 'bankAddress', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (tableDescription.iban) {
      await queryInterface.removeColumn('bankDetails', 'iban');
    }

    if (tableDescription.swiftCode) {
      await queryInterface.removeColumn('bankDetails', 'swiftCode');
    }

    const indexes = await queryInterface.showIndex('bankDetails');
    const uniqueAccountIndex = indexes.find(
      idx => idx.unique && idx.fields.some(f => f.attribute === 'accountNumber')
    );
    if (uniqueAccountIndex) {
      await queryInterface.removeIndex('bankDetails', uniqueAccountIndex.name);
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('bankDetails')) return;

    const tableDescription = await queryInterface.describeTable('bankDetails');

    if (!tableDescription.iban) {
      await queryInterface.addColumn('bankDetails', 'iban', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.swiftCode) {
      await queryInterface.addColumn('bankDetails', 'swiftCode', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },
};
