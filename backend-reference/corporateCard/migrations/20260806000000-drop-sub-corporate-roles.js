'use strict';

const TABLE = 'subCorporateRoles';

module.exports = {
  up: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes(TABLE)) return;
    await queryInterface.dropTable(TABLE);
  },

  down: async () => {},
};
