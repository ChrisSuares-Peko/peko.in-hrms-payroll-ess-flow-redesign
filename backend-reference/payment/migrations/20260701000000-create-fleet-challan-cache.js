'use strict';

// Per-vehicle cache of Droom challans for the Turbo fleet view, so the page reads from our DB
// (one query) instead of firing one live Droom get-challan per fleet vehicle on every load.
const TABLE = 'fleetChallanCaches';
const INDEX_NAME = 'fleet_challan_caches_credential_vehicle';

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
          primaryKey: true,
        },
        credentialId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        vehicleNumber: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        // Full Droom challan objects for this vehicle (empty array = fetched, none found).
        challans: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        lastFetchedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      });
    }

    const indexes = await queryInterface.showIndex(TABLE);
    if (!indexes.some((i) => i.name === INDEX_NAME)) {
      await queryInterface.addIndex(TABLE, ['credentialId', 'vehicleNumber'], {
        name: INDEX_NAME,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface)) {
      await queryInterface.dropTable(TABLE);
    }
  },
};
