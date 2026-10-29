'use strict';

module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('bankDetails')) return;

    const indexes = await queryInterface.showIndex('bankDetails');
    const uniqueAccountIndex = indexes.find(
      idx => idx.unique && idx.fields.some(f => f.attribute === 'accountNumber')
    );
    if (uniqueAccountIndex) {
      await queryInterface.removeIndex('bankDetails', uniqueAccountIndex.name);
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('bankDetails')) return;

    await queryInterface.addIndex('bankDetails', ['accountNumber'], { unique: true });
  },
};
