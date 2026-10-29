'use strict'

const TABLE = 'procure_vendors'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    if (!tables.some((t) => String(t).toLowerCase() === TABLE.toLowerCase())) return
    const desc = await queryInterface.describeTable(TABLE)
    if (!desc.notes) {
      await queryInterface.addColumn(TABLE, 'notes', { type: Sequelize.TEXT, allowNull: true })
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables()
    if (!tables.some((t) => String(t).toLowerCase() === TABLE.toLowerCase())) return
    const desc = await queryInterface.describeTable(TABLE)
    if (desc.notes) {
      await queryInterface.removeColumn(TABLE, 'notes')
    }
  },
}
