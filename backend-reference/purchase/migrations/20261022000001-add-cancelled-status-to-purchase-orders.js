'use strict';

const NEW_STATUS = 'Cancelled';

// "ENUM('Draft','PO Issued','Closed')" -> ['Draft', 'PO Issued', 'Closed']
const enumValues = (type) => [...String(type || '').matchAll(/'((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));

const enumSql = (values) =>
  `ALTER TABLE purchase_orders MODIFY COLUMN status ENUM(${values.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ')}) NOT NULL DEFAULT 'Draft'`;

async function getColumns(queryInterface) {
  try {
    return await queryInterface.describeTable('purchase_orders');
  } catch {
    return null;
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await getColumns(queryInterface);
    if (!columns) return;

    const current = enumValues(columns.status?.type);
    if (current.length && !current.includes(NEW_STATUS)) {
      await queryInterface.sequelize.query(enumSql([...current, NEW_STATUS]));
    }

    if (!columns.cancelledAt) {
      await queryInterface.addColumn('purchase_orders', 'cancelledAt', { type: Sequelize.DATE, allowNull: true });
    }
    if (!columns.cancelReason) {
      await queryInterface.addColumn('purchase_orders', 'cancelReason', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!columns.cancelledBy) {
      await queryInterface.addColumn('purchase_orders', 'cancelledBy', { type: Sequelize.STRING(150), allowNull: true });
    }
  },

  async down(queryInterface) {
    const columns = await getColumns(queryInterface);
    if (!columns) return;

    const current = enumValues(columns.status?.type);
    if (current.includes(NEW_STATUS)) {
      await queryInterface.sequelize.query(`UPDATE purchase_orders SET status = 'Closed' WHERE status = '${NEW_STATUS}'`);
      await queryInterface.sequelize.query(enumSql(current.filter((v) => v !== NEW_STATUS)));
    }

    // cancelledAt predates this migration on synced DBs, so it stays.
    if (columns.cancelledBy)  await queryInterface.removeColumn('purchase_orders', 'cancelledBy');
    if (columns.cancelReason) await queryInterface.removeColumn('purchase_orders', 'cancelReason');
  },
};
