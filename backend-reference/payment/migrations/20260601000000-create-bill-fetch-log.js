'use strict';

// Guarded against sequelize.sync() having already created the table/index on startup.
const TABLE = 'billFetchLogs';
const INDEX_NAME = 'bill_fetch_logs_credential_id_created_at';

const tableExists = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .includes(TABLE);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface))) {
      await queryInterface.createTable(TABLE, {
        id: {
          type: Sequelize.BIGINT,
          autoIncrement: true,
          primaryKey: true
        },
        credentialId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        inputParams: {
          type: Sequelize.JSON,
          allowNull: true
        },
        statusCode: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      });
    }

    const indexes = await queryInterface.showIndex(TABLE);
    if (!indexes.some((i) => i.name === INDEX_NAME)) {
      await queryInterface.addIndex(TABLE, ['credentialId', 'createdAt'], { name: INDEX_NAME });
    }
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface)) {
      await queryInterface.dropTable(TABLE);
    }
  }
};
