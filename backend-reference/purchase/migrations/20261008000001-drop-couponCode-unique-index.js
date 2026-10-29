'use strict';

const hasTable = (tables, name) =>
  tables.some((t) => t.toLowerCase() === name.toLowerCase());

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!hasTable(tables, 'couponCodes')) return;

    const rows = await queryInterface.sequelize.query('SHOW INDEX FROM couponCodes', {
      type: Sequelize.QueryTypes.SELECT,
    });

    const indexColumns = {};
    for (const row of rows) {
      if (!indexColumns[row.Key_name]) indexColumns[row.Key_name] = [];
      indexColumns[row.Key_name].push(row);
    }

    for (const [keyName, columns] of Object.entries(indexColumns)) {
      if (keyName === 'PRIMARY') continue;
      const isUnique = Number(columns[0].Non_unique) === 0;
      const isCouponCodeOnly = columns.length === 1 && columns[0].Column_name === 'couponCode';
      if (isUnique && isCouponCodeOnly) {
        await queryInterface.sequelize.query(`ALTER TABLE couponCodes DROP INDEX \`${keyName}\``);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.addIndex('couponCodes', {
      name: 'couponCode',
      unique: true,
      fields: ['couponCode'],
    });
  },
};
