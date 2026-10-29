'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const WebhookEvent = sequelizeConfig.define('webhookEvent', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  // Deduplication key: cf_payment_id or subscription_id+eventType
  idempotencyKey: {
    type: Sequelize.STRING(255),
    allowNull: false,
    unique: true,
  },
  eventType: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  // Full raw webhook body stored as JSON — never lost even if processing fails
  payload: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM('PENDING', 'PROCESSED', 'FAILED'),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  // Populated when status=FAILED — stores exception message for admin visibility
  processingError: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  // Max 2 manual retries via admin API; capped at 2
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
  /** Monotonic per vendorSubscriptionId so events can be listed in delivery order */
  eventSequence: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  /**
   * Classifier for filtering. For payment webhooks: SUBSCRIPTION_AUTH | SUBSCRIPTION_CHARGE (from payment_type).
   * For all other Cashfree subscription events: same string as `eventType` (e.g. SUBSCRIPTION_STATUS_CHANGE).
   */
  webhookContext: {
    type: Sequelize.STRING(64),
    allowNull: true,
  },
  /**
   * Logical source of the webhook (multi-product inbox). Default: Cashfree subscription webhooks.
   * Add new values when ingesting other providers without new tables.
   */
  webhookSource: {
    type: Sequelize.STRING(64),
    allowNull: false,
    defaultValue: 'peko_subscriptions',
  },
}, {
  tableName: 'webhookEvents',
  timestamps: true,
});

module.exports = WebhookEvent;
