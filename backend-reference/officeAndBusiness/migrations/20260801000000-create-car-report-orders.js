'use strict';

// One row per purchased Car Report (Droom MYBIZ), 1:1 with the shared `orders` row via
// corporateTxnId. The money lives in `orders` (written by the wallet/PG transaction
// helpers); this table holds the report-specific payload — most importantly the price
// bands the user was shown at purchase time, which are never re-fetched.
const TABLE = 'carReportOrders';
const TXN_INDEX = 'car_report_orders_corporate_txn_id';
const LIST_INDEX = 'car_report_orders_credential_order_date';

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
        // Also the public orderId the frontend puts in ?orderId=.
        corporateTxnId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        credentialId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        subCorporateUserId: {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        reportType: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        reportName: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        // Absent for a manually entered valuation, which is priced from the spec alone.
        vehicleNumber: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        // make + model + variant, precomputed so the list column and the search
        // predicate don't have to reassemble it per row.
        vehicleModel: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        bodyType: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        isManualVehicle: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        // Total incl. surcharge, denormalised at purchase. Never mutates.
        amount: {
          type: Sequelize.DECIMAL(12, 4),
          defaultValue: 0,
        },
        paymentMode: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        // Denormalised for the date-range filter and the default sort.
        orderDate: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        // Internal upper-snake code; mapped to display labels at read time.
        reportStatus: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'BUILDING',
        },
        // The fair-market-value bands shown to the user before they paid.
        valuationBands: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        // { modelName, year, kilometres, city } — the header of the result card.
        valuationSpec: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        // Full flat form payload, for audit and future vendor replay.
        formValues: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        // Reserved for the history/inspection products, which do call the vendor.
        vendorReference: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        vendorResponse: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      });
    }

    const indexes = await queryInterface.showIndex(TABLE);
    if (!indexes.some((i) => i.name === TXN_INDEX)) {
      await queryInterface.addIndex(TABLE, ['corporateTxnId'], {
        name: TXN_INDEX,
        unique: true,
      });
    }
    if (!indexes.some((i) => i.name === LIST_INDEX)) {
      await queryInterface.addIndex(TABLE, ['credentialId', 'orderDate'], {
        name: LIST_INDEX,
      });
    }
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface)) {
      await queryInterface.dropTable(TABLE);
    }
  },
};
