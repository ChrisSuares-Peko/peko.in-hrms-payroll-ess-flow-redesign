'use strict';

const TABLE = 'payment_methods';
const PG_PROVIDER_COLUMN = 'pgProvider';

const describeTableOrNull = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await describeTableOrNull(queryInterface, TABLE);
    if (columns && !columns[PG_PROVIDER_COLUMN]) {
      await queryInterface.addColumn(TABLE, PG_PROVIDER_COLUMN, {
        type: Sequelize.STRING(64),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const columns = await describeTableOrNull(queryInterface, TABLE);
    if (columns && columns[PG_PROVIDER_COLUMN]) {
      await queryInterface.removeColumn(TABLE, PG_PROVIDER_COLUMN);
    }
  },
};
