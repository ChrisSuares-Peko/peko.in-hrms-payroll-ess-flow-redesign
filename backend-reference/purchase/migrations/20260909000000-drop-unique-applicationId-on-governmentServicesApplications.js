'use strict'

// This table has no create-table migration of its own — it was brought into
// being by sequelize.sync() reading the entity file (see git history), which
// is where the original unique index on applicationId came from. So there's
// no prior "up" migration to invert here; this looks up whatever unique
// index(es) sync() actually created on that column (by column, not a
// hardcoded index name, since Sequelize's auto-naming isn't guaranteed) and
// drops them. Needed because Create Business is idempotent per PAN/business
// — the same vendor application_id can now legitimately repeat across
// several separate purchases of a catalog item (e.g. two different
// Trademark Registration filings against the same business), and a fresh
// row is created per Create Lead (see saveApplicationV2).
module.exports = {
  up: async (queryInterface) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    let indexes = []
    try {
      indexes = await queryInterface.showIndex(tableName)
    } catch (err) {
      return
    }

    const uniqueApplicationIdIndexes = indexes.filter(idx =>
      idx.unique &&
      Array.isArray(idx.fields) &&
      idx.fields.length === 1 &&
      idx.fields[0]?.attribute === 'applicationId'
    )

    for (const idx of uniqueApplicationIdIndexes) {
      await queryInterface.removeIndex(tableName, idx.name)
    }
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    const indexes = await queryInterface.showIndex(tableName)
    const alreadyUnique = indexes.some(idx =>
      idx.unique &&
      Array.isArray(idx.fields) &&
      idx.fields.length === 1 &&
      idx.fields[0]?.attribute === 'applicationId'
    )
    if (alreadyUnique) return

    await queryInterface.addIndex(tableName, ['applicationId'], {
      unique: true,
      name: 'governmentServicesApplications_applicationId_unique',
    })
  },
}
