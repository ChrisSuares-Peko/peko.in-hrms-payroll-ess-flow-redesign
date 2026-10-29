'use strict';

const TABLE = 'tax_amendments';
const NEW_COLS = ['placeOfSupply', 'noteType', 'portCode', 'shippingBillNo', 'shippingBillDate'];

async function getExistingCols(queryInterface) {
  const [columns] = await queryInterface.sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${TABLE}'`
  );
  return columns.map(c => c.COLUMN_NAME);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.some(t => t.toLowerCase() === TABLE)) return;

    const colNames = await getExistingCols(queryInterface);

    if (!colNames.includes('placeOfSupply')) {
      await queryInterface.addColumn(TABLE, 'placeOfSupply', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'receiverName',
      });
    }
    if (!colNames.includes('noteType')) {
      await queryInterface.addColumn(TABLE, 'noteType', {
        type: Sequelize.ENUM('C', 'D'),
        allowNull: true,
        after: 'placeOfSupply',
      });
    }
    if (!colNames.includes('portCode')) {
      await queryInterface.addColumn(TABLE, 'portCode', {
        type: Sequelize.STRING(10),
        allowNull: true,
        after: 'noteType',
      });
    }
    if (!colNames.includes('shippingBillNo')) {
      await queryInterface.addColumn(TABLE, 'shippingBillNo', {
        type: Sequelize.STRING(50),
        allowNull: true,
        after: 'portCode',
      });
    }
    if (!colNames.includes('shippingBillDate')) {
      await queryInterface.addColumn(TABLE, 'shippingBillDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        after: 'shippingBillNo',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.some(t => t.toLowerCase() === TABLE)) return;

    const colNames = await getExistingCols(queryInterface);

    for (const col of [...NEW_COLS].reverse()) {
      if (colNames.includes(col)) {
        await queryInterface.removeColumn(TABLE, col);
      }
    }
  },
};
