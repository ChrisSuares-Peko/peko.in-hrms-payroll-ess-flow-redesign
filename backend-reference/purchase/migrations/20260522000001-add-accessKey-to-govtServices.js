'use strict'

const operatorsData = require('../utils/operatorsData.json')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists (case-insensitive)
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservices')
    if (!tableName) return

    // Check if column already exists
    const columns = await queryInterface.describeTable(tableName)
    if (columns.accessKey) return

    // 1. Add as nullable first so existing rows don't violate the constraint
    await queryInterface.addColumn(tableName, 'accessKey', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'slug',
    })

    // 2. Backfill accessKey for all existing rows using operatorsData
    for (const [slug, data] of Object.entries(operatorsData)) {
      if (data.accessKey) {
        await queryInterface.sequelize.query(
          `UPDATE govtServices SET accessKey = :accessKey WHERE slug = :slug`,
          { replacements: { accessKey: data.accessKey, slug } }
        )
      }
    }

    // 3. Enforce NOT NULL only if all rows have been backfilled
    const [nullRows] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) AS count FROM \`${tableName}\` WHERE accessKey IS NULL`
    )
    const nullCount = nullRows[0]?.count || nullRows[0]?.COUNT || 0
    if (parseInt(nullCount) === 0) {
      await queryInterface.changeColumn(tableName, 'accessKey', {
        type: Sequelize.STRING,
        allowNull: false,
      })
    }
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('govtServices')) return

    const downTableName = tables.find(t => t.toLowerCase() === 'govtservices')
    if (!downTableName) return

    const columns = await queryInterface.describeTable(downTableName)
    if (!columns.accessKey) return

    await queryInterface.removeColumn(downTableName, 'accessKey')
  },
}
