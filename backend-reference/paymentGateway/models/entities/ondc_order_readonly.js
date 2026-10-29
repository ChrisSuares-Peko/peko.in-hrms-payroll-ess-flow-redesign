'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * READ-ONLY views of two tables that `purchase` owns: ondcOrders and
 * ondcOrderRefunds. Needed here for the refund-credited email (spec template 13),
 * which fires on the Cashfree REFUND_STATUS_WEBHOOK in this service but describes
 * an order that only purchase records.
 *
 * ------------------------------------------------------------------------------
 * TWO RULES. Both matter.
 * ------------------------------------------------------------------------------
 * 1. NEVER call sync() / ensure*() on these models, and never add one. `define()`
 *    alters nothing; sync() does. purchase's ensureOndcOrdersTable() ALTERs
 *    ondcOrders on boot, and that table sits at InnoDB's row-size limit where a
 *    rejected ALTER makes the whole flow throw. A second service running its own
 *    self-heal against it is exactly the failure that must not be introduced.
 * 2. Only the columns this service reads are declared. Sequelize names the model's
 *    attributes in every SELECT, so declaring a column purchase hasn't deployed yet
 *    would produce "Unknown column" here. Keep the list minimal and boring; if you
 *    need a new field, add it here only after purchase has shipped it.
 *
 * Writes to these tables stay in purchase, without exception.
 */

const READ_ONLY = { timestamps: false, freezeTableName: true };

const ondcOrdersReadOnly = sequelizeConfig.define('ondcOrders', {
    id: { type: Sequelize.BIGINT, primaryKey: true },
    transactionId: Sequelize.STRING,
    orderId: Sequelize.STRING,
    vendorName: Sequelize.STRING,
    paymentRef: Sequelize.STRING,
    corporateUserId: Sequelize.INTEGER,
    subCorporateUserId: Sequelize.BIGINT,
    billing: Sequelize.JSON,
    payment: Sequelize.JSON,
    // Added when the 2026-08-24 spec revision gave the refund-credited mail an
    // order-summary table. All four have been in purchase's schema since the
    // table's first release, so declaring them here cannot produce an
    // "Unknown column" — see rule 2 above.
    items: Sequelize.JSON,
    quote: Sequelize.JSON,
    amountPaid: Sequelize.DECIMAL(12, 2),
    totalAmount: Sequelize.DECIMAL(12, 2),
}, { ...READ_ONLY, tableName: 'ondcOrders' });

/**
 * The catalog snapshot, for item thumbnails only. Rows here are purged on a
 * schedule by purchase (scheduler/services/ondcProductPurge.js), so a miss is the
 * normal case for an older order, not an error.
 */
const ondcProductsReadOnly = sequelizeConfig.define('ondcProductsRO', {
    id: { type: Sequelize.BIGINT, primaryKey: true },
    transactionId: Sequelize.STRING,
    ondcProductId: Sequelize.STRING,
    images: Sequelize.JSON,
    symbol: Sequelize.TEXT,
}, { ...READ_ONLY, tableName: 'ondcProducts' });

const ondcOrderRefundsReadOnly = sequelizeConfig.define('ondcOrderRefundsRO', {
    id: { type: Sequelize.BIGINT, primaryKey: true },
    ondcOrderId: Sequelize.BIGINT,
    transactionId: Sequelize.STRING,
    paymentRef: Sequelize.STRING,
    refundId: Sequelize.STRING,
    amount: Sequelize.DECIMAL(12, 2),
    status: Sequelize.STRING,
}, { ...READ_ONLY, tableName: 'ondcOrderRefunds' });

module.exports = { ondcOrdersReadOnly, ondcOrderRefundsReadOnly, ondcProductsReadOnly }
