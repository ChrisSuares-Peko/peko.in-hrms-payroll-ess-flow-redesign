'use strict';

async function tableExists(queryInterface, tableName) {
  // describeTable resolves the table name case-insensitively (matching how MySQL
  // itself resolves it), unlike comparing against the literal names from
  // showAllTables(), which mysql2 can return lowercased regardless of how the
  // table was created/declared.
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

async function columnExists(queryInterface, tableName, columnName) {
  const tableDescription = await queryInterface.describeTable(tableName);
  return Boolean(tableDescription[columnName]);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (!(await tableExists(queryInterface, 'giftCards'))) return;
    if (await columnExists(queryInterface, 'giftCards', 'usageType')) return;

    await queryInterface.addColumn('giftCards', 'usageType', {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    if (!(await tableExists(queryInterface, 'giftCards'))) return;
    if (!(await columnExists(queryInterface, 'giftCards', 'usageType'))) return;

    await queryInterface.removeColumn('giftCards', 'usageType');
  }
};
