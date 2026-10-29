'use strict';

const TABLE = 'payment_methods';
const IS_ACTIVE_COLUMN = 'isActive';

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
    if (columns && !columns[IS_ACTIVE_COLUMN]) {
      await queryInterface.addColumn(TABLE, IS_ACTIVE_COLUMN, {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await describeTableOrNull(queryInterface, TABLE);
    if (columns && columns[IS_ACTIVE_COLUMN]) {
      await queryInterface.removeColumn(TABLE, IS_ACTIVE_COLUMN);
    }
  },
};
