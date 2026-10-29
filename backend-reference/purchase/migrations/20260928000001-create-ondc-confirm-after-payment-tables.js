'use strict'
/**
 * Creates the two confirm-after-payment tables (services/ondcConfirmAfterPayment.js):
 *
 *   ondcCheckoutConfirms  one row per captured Office Supplies checkout
 *   ondcConfirmAttempts   one row per seller group of that checkout
 *
 * Column definitions mirror models/entities/ondc_checkout_confirm.js and
 * models/entities/ondc_confirm_attempt.js exactly, so this and the boot-time
 * ensure…Table() converge on the same schema whichever runs first.
 *
 * House pattern: entity files create their own tables on boot via sync()/ensureTable
 * and migrations only patch. Like 20260804000004-create-ondcSellerPayouts.js, this
 * one creates each table if absent AND patches any missing column/index, so it is
 * idempotent on a fresh database and after the entities have already run.
 */
const ONDC_CHECKOUT_CONFIRMS = 'ondcCheckoutConfirms'
const ONDC_CONFIRM_ATTEMPTS = 'ondcConfirmAttempts'

const CHECKOUT_COLUMNS = (Sequelize) => ({
  paymentRef: { type: Sequelize.STRING(64), allowNull: false },
  corporateUserId: { type: Sequelize.INTEGER, allowNull: true },
  subCorporateUserId: { type: Sequelize.INTEGER, allowNull: true },
  groupCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  capturedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
  capturedAt: { type: Sequelize.DATE, allowNull: true },

  // IN_PROGRESS | COMPLETED
  status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'IN_PROGRESS' },
  // CONFIRMED | PARTIAL | FAILED
  outcome: { type: Sequelize.STRING(16), allowNull: true },
  completedAt: { type: Sequelize.DATE, allowNull: true },

  refundAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  // null | PENDING | INITIATED | FAILED
  refundStatus: { type: Sequelize.STRING(16), allowNull: true },
  refundAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  refundRequestedAt: { type: Sequelize.DATE, allowNull: true },
  refundError: { type: Sequelize.TEXT, allowNull: true },
})

const ATTEMPT_COLUMNS = (Sequelize) => ({
  paymentRef: { type: Sequelize.STRING(64), allowNull: false },
  transactionId: { type: Sequelize.STRING, allowNull: false },
  bppId: { type: Sequelize.STRING, allowNull: true },
  bppUri: { type: Sequelize.TEXT, allowNull: true },
  providerId: { type: Sequelize.STRING, allowNull: true },
  vendorName: { type: Sequelize.STRING, allowNull: true },
  domain: { type: Sequelize.STRING(64), allowNull: true },
  city: { type: Sequelize.STRING(64), allowNull: true },
  quoteAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
  ondcOrderId: { type: Sequelize.STRING, allowNull: true },
  messageId: { type: Sequelize.STRING(64), allowNull: true },

  // PENDING | DISPATCHED | CONFIRMED | FAILED
  status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'PENDING' },
  failureReason: { type: Sequelize.STRING(40), allowNull: true },
  failureDetail: { type: Sequelize.TEXT, allowNull: true },
  dispatchedAt: { type: Sequelize.DATE, allowNull: true },
  deadlineAt: { type: Sequelize.DATE, allowNull: true },
  respondedAt: { type: Sequelize.DATE, allowNull: true },
  orderState: { type: Sequelize.STRING(64), allowNull: true },

  lateConfirmAt: { type: Sequelize.DATE, allowNull: true },
  // SENT | FAILED | CANCELLED
  cancelStatus: { type: Sequelize.STRING(16), allowNull: true },
  cancelAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  cancelError: { type: Sequelize.TEXT, allowNull: true },
})

const TABLES = [
  {
    name: ONDC_CHECKOUT_CONFIRMS,
    columns: CHECKOUT_COLUMNS,
    indexes: [
      { name: 'ondc_checkout_confirms_payment_ref', fields: ['paymentRef'], unique: true },
      { name: 'ondc_checkout_confirms_status', fields: ['status'] },
      { name: 'ondc_checkout_confirms_refund', fields: ['refundStatus', 'refundRequestedAt'] },
    ],
  },
  {
    name: ONDC_CONFIRM_ATTEMPTS,
    columns: ATTEMPT_COLUMNS,
    indexes: [
      { name: 'ondc_confirm_attempts_ref_txn', fields: ['paymentRef', 'transactionId'], unique: true },
      { name: 'ondc_confirm_attempts_status_deadline', fields: ['status', 'deadlineAt'] },
      { name: 'ondc_confirm_attempts_message', fields: ['messageId'] },
      { name: 'ondc_confirm_attempts_transaction', fields: ['transactionId'] },
    ],
  },
]

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of TABLES) {
      if (!(await hasTable(queryInterface, table.name))) {
        await queryInterface.createTable(table.name, {
          id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
          ...table.columns(Sequelize),
          createdAt: Sequelize.DATE,
          updatedAt: Sequelize.DATE,
        })
      } else {
        const desc = await queryInterface.describeTable(table.name)
        for (const [name, definition] of Object.entries(table.columns(Sequelize))) {
          // NOT NULL columns cannot be added to a populated table without a default,
          // so patch them as nullable — the entity is the authority on new rows.
          if (!desc[name]) {
            await queryInterface.addColumn(table.name, name, { ...definition, allowNull: true })
          }
        }
      }

      const existing = await queryInterface.showIndex(table.name)
      const existingNames = new Set(existing.map((i) => i.name))
      for (const idx of table.indexes) {
        if (!existingNames.has(idx.name)) {
          await queryInterface.addIndex(table.name, idx.fields, { name: idx.name, unique: Boolean(idx.unique) })
        }
      }
    }
  },

  async down(queryInterface) {
    for (const table of [...TABLES].reverse()) {
      if (await hasTable(queryInterface, table.name)) {
        await queryInterface.dropTable(table.name)
      }
    }
  },
}
