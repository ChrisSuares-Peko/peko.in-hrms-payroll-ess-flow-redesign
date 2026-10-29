'use strict';

/** @type {import('sequelize-cli').Migration} */

const TABLE = 'manualRefunds';

async function tableExists(queryInterface, tableName) {
  const [result] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = :tableName`,
    { replacements: { tableName }, type: queryInterface.sequelize.QueryTypes.SELECT }
  );
  return Number(result.cnt) > 0;
}

async function columnExists(queryInterface, tableName, columnName) {
  const [result] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = :tableName AND column_name = :columnName`,
    { replacements: { tableName, columnName }, type: queryInterface.sequelize.QueryTypes.SELECT }
  );
  return Number(result.cnt) > 0;
}

async function hasIndex(queryInterface, tableName, indexName) {
  const [result] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = :tableName AND index_name = :indexName`,
    { replacements: { tableName, indexName }, type: queryInterface.sequelize.QueryTypes.SELECT }
  );
  return Number(result.cnt) > 0;
}

const relationColumns = (Sequelize) => ({
  orderId: {
    type: Sequelize.BIGINT,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  paymentGatewayOrderId: {
    type: Sequelize.BIGINT,
    allowNull: true,
    references: {
      model: 'paymentGatewayOrders',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
});

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, TABLE)) {
      for (const [columnName, definition] of Object.entries(relationColumns(Sequelize))) {
        if (!(await columnExists(queryInterface, TABLE, columnName))) {
          await queryInterface.addColumn(TABLE, columnName, definition);
        }
      }
    } else {
      await queryInterface.createTable(TABLE, {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        corporateTxnId: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        ...relationColumns(Sequelize),
        pgProvider: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED'),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        refundAmount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
        },
        paidAmount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: true,
        },
        credentialId: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        serviceName: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        reason: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        gatewayOrderId: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        gatewayReference: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        paymentDetails: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        refundReference: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        remarks: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        updatedBy: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        history: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
    }

    if (!(await hasIndex(queryInterface, TABLE, 'idx_manual_refunds_status_created_at'))) {
      await queryInterface.addIndex(TABLE, ['status', 'createdAt'], {
        name: 'idx_manual_refunds_status_created_at',
      });
    }
    if (!(await hasIndex(queryInterface, TABLE, 'idx_manual_refunds_credential_id'))) {
      await queryInterface.addIndex(TABLE, ['credentialId'], {
        name: 'idx_manual_refunds_credential_id',
      });
    }
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface, TABLE)) {
      await queryInterface.dropTable(TABLE);
    }
  },
};
