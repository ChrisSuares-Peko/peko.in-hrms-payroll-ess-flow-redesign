'use strict';

/** @type {import('sequelize-cli').Migration} */

async function hasIndex(queryInterface, tableName, indexName) {
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((idx) => idx.name === indexName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const pgOrders = await queryInterface.describeTable('paymentGatewayOrders');

    if (!pgOrders.vendorSubscriptionId) {
      await queryInterface.addColumn('paymentGatewayOrders', 'vendorSubscriptionId', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!pgOrders.orderKind) {
      await queryInterface.addColumn('paymentGatewayOrders', 'orderKind', {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'PAYMENT_GATEWAY',
      });
    }

    // Ensure current code's status values are supported.
    await queryInterface.changeColumn('paymentGatewayOrders', 'status', {
      type: Sequelize.ENUM('PENDING', 'ORDERED', 'IN_PROGRESS', 'COMPLETE', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    });

    if (!(await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_vendor_subscription_id'))) {
      await queryInterface.addIndex('paymentGatewayOrders', ['vendorSubscriptionId'], {
        name: 'idx_payment_gateway_orders_vendor_subscription_id',
      });
    }

    if (!(await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_order_kind'))) {
      await queryInterface.addIndex('paymentGatewayOrders', ['orderKind'], {
        name: 'idx_payment_gateway_orders_order_kind',
      });
    }

    const webhookEvents = await queryInterface.describeTable('webhookEvents');

    if (!webhookEvents.vendorSubscriptionId) {
      await queryInterface.addColumn('webhookEvents', 'vendorSubscriptionId', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!webhookEvents.merchantPaymentId) {
      await queryInterface.addColumn('webhookEvents', 'merchantPaymentId', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!webhookEvents.eventSequence) {
      await queryInterface.addColumn('webhookEvents', 'eventSequence', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
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

    if (!(await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_vendor_subscription_id'))) {
      await queryInterface.addIndex('webhookEvents', ['vendorSubscriptionId'], {
        name: 'idx_webhook_events_vendor_subscription_id',
      });
    }
    if (!(await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_vendor_seq'))) {
      await queryInterface.addIndex('webhookEvents', ['vendorSubscriptionId', 'eventSequence'], {
        name: 'idx_webhook_events_vendor_seq',
      });
    }
    if (!(await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_webhook_context'))) {
      await queryInterface.addIndex('webhookEvents', ['webhookContext'], {
        name: 'idx_webhook_events_webhook_context',
      });
    }
    if (!(await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_webhook_source'))) {
      await queryInterface.addIndex('webhookEvents', ['webhookSource'], {
        name: 'idx_webhook_events_webhook_source',
      });
    }
  },

  async down(queryInterface) {
    // Keep rollback minimal and safe for shared environments.
    if (await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_webhook_source')) {
      await queryInterface.removeIndex('webhookEvents', 'idx_webhook_events_webhook_source');
    }
    if (await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_vendor_seq')) {
      await queryInterface.removeIndex('webhookEvents', 'idx_webhook_events_vendor_seq');
    }
    if (await hasIndex(queryInterface, 'webhookEvents', 'idx_webhook_events_vendor_subscription_id')) {
      await queryInterface.removeIndex('webhookEvents', 'idx_webhook_events_vendor_subscription_id');
    }
    if (await hasIndex(queryInterface, 'paymentGatewayOrders', 'idx_payment_gateway_orders_vendor_subscription_id')) {
      await queryInterface.removeIndex('paymentGatewayOrders', 'idx_payment_gateway_orders_vendor_subscription_id');
    }
  },
};

