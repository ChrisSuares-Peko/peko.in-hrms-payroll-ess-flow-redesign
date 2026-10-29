'use strict';

/** @type {import('sequelize-cli').Migration} */

async function tableExists(queryInterface, tableName) {
  const [result] = await queryInterface.sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = :tableName`,
    { replacements: { tableName }, type: queryInterface.sequelize.QueryTypes.SELECT }
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

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── paymentGatewayOrders ──────────────────────────────────────────────────
    if (!(await tableExists(queryInterface, 'paymentGatewayOrders'))) {
      await queryInterface.createTable('paymentGatewayOrders', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        paymentRefId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        referenceNo: {
          type: Sequelize.STRING(128),
          allowNull: true,
        },
        vendorSubscriptionId: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        paymentData: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        orderKind: {
          type: Sequelize.STRING(64),
          allowNull: false,
          defaultValue: 'PAYMENT_GATEWAY',
        },
        status: {
          type: Sequelize.ENUM('PENDING', 'ORDERED', 'IN_PROGRESS', 'COMPLETE', 'FAILED'),
          defaultValue: 'PENDING',
          allowNull: false,
        },
        paymentResponse: {
          type: Sequelize.TEXT,
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
      });
    } else {
      const pgOrders = await queryInterface.describeTable('paymentGatewayOrders');

      if (!pgOrders.orderKind) {
        await queryInterface.addColumn('paymentGatewayOrders', 'orderKind', {
          type: Sequelize.STRING(64),
          allowNull: false,
          defaultValue: 'PAYMENT_GATEWAY',
        });
      }

      if (!pgOrders.referenceNo) {
        await queryInterface.addColumn('paymentGatewayOrders', 'referenceNo', {
          type: Sequelize.STRING(128),
          allowNull: true,
        });
      }
    }

    if (!(await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_order_kind'))) {
      await queryInterface.addIndex('paymentGatewayOrders', ['orderKind'], {
        name: 'idx_payment_gateway_orders_order_kind',
      });
    }

    if (!(await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_reference_no'))) {
      await queryInterface.addIndex('paymentGatewayOrders', ['referenceNo'], {
        name: 'idx_payment_gateway_orders_reference_no',
      });
    }

    // ── webhookEvents ─────────────────────────────────────────────────────────
    if (!(await tableExists(queryInterface, 'webhookEvents'))) {
      await queryInterface.createTable('webhookEvents', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        idempotencyKey: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        eventType: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        payload: {
          type: Sequelize.JSON,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('PENDING', 'PROCESSED', 'FAILED'),
          defaultValue: 'PENDING',
          allowNull: false,
        },
        processingError: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        retryCount: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          allowNull: false,
        },
        lastProcessedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        vendorSubscriptionId: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        merchantPaymentId: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        eventSequence: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        webhookContext: {
          type: Sequelize.STRING(64),
          allowNull: true,
        },
        webhookSource: {
          type: Sequelize.STRING(64),
          allowNull: false,
          defaultValue: 'peko_subscriptions',
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    } else {
      const webhookEvents = await queryInterface.describeTable('webhookEvents');

      if (!webhookEvents.webhookContext) {
        await queryInterface.addColumn('webhookEvents', 'webhookContext', {
          type: Sequelize.STRING(64),
          allowNull: true,
        });
      }

      if (!webhookEvents.webhookSource) {
        await queryInterface.addColumn('webhookEvents', 'webhookSource', {
          type: Sequelize.STRING(64),
          allowNull: false,
          defaultValue: 'peko_subscriptions',
        });
      }
    }

    if (!(await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_webhook_context'))) {
      await queryInterface.addIndex('webhookEvents', ['webhookContext'], {
        name: 'idx_webhook_events_webhook_context',
      });
    }
  },

  async down(queryInterface) {
    // ── webhookEvents ─────────────────────────────────────────────────────────
    if (await tableExists(queryInterface, 'webhookEvents')) {
      if (await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_webhook_context')) {
        await queryInterface.removeIndex('webhookEvents', 'idx_webhook_events_webhook_context');
      }
      const webhookEventsDown = await queryInterface.describeTable('webhookEvents');
      if (webhookEventsDown.webhookContext) {
        await queryInterface.removeColumn('webhookEvents', 'webhookContext');
      }
    }

    // ── paymentGatewayOrders ──────────────────────────────────────────────────
    if (await tableExists(queryInterface, 'paymentGatewayOrders')) {
      if (await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_reference_no')) {
        await queryInterface.removeIndex('paymentGatewayOrders', 'idx_payment_gateway_orders_reference_no');
      }
      if (await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_order_kind')) {
        await queryInterface.removeIndex('paymentGatewayOrders', 'idx_payment_gateway_orders_order_kind');
      }
      const pgOrdersDown = await queryInterface.describeTable('paymentGatewayOrders');
      if (pgOrdersDown.referenceNo) {
        await queryInterface.removeColumn('paymentGatewayOrders', 'referenceNo');
      }
      if (pgOrdersDown.orderKind) {
        await queryInterface.removeColumn('paymentGatewayOrders', 'orderKind');
      }
    }
  },
};
