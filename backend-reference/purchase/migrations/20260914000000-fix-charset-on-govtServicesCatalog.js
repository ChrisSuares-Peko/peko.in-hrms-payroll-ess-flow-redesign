'use strict'

module.exports = {
  async up(queryInterface) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservicescatalogs')
    if (!tableName) return

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
  },

  async down() {}
}
