'use strict';

const PG_PROVIDER_COLUMN = 'pgProvider';
const TABLES = ['paymentGatewayOrders'];

const describeTableOrNull = async (queryInterface, tableName) => {
  try {
    return await queryInterface.describeTable(tableName);
  } catch {
    return null;
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const tableName of TABLES) {
      const columns = await describeTableOrNull(queryInterface, tableName);
      if (columns && !columns[PG_PROVIDER_COLUMN]) {
        await queryInterface.addColumn(tableName, PG_PROVIDER_COLUMN, {
          type: Sequelize.STRING(64),
          allowNull: true,
          defaultValue: null,
        });
      }
    }
  },

  async down(queryInterface) {
    for (const tableName of TABLES) {
      const columns = await describeTableOrNull(queryInterface, tableName);
      if (columns && columns[PG_PROVIDER_COLUMN]) {
        await queryInterface.removeColumn(tableName, PG_PROVIDER_COLUMN);
      }
    }
  },
};
