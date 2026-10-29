'use strict'

const { QueryTypes } = require('sequelize')

/**
 * Restore officeSupplyCategories.keywords (JSON tag list) as the ingest
 * mapping and copy existing ondcCategory comma-tokens into it. Leaves
 * ondcCategory in place so the admin tree can still read tags until the
 * copy has landed on keywords (the model no longer SELECTs ondcCategory).
 *
 * House pattern: table may be missing on a fresh DB (created later by
 * ensureTable). Every step is guarded. Boot-time WANTED_COLUMNS must list
 * keywords and must not list ondcCategory, or heal would undo this.
 */

const CATEGORIES = ['officeSupplyCategories']

const resolveTable = async (queryInterface, candidates) => {
  const tables = await queryInterface.showAllTables()
  const wanted = candidates.map((n) => n.toLowerCase())
  return tables.find((t) => wanted.includes(String(t).toLowerCase())) || null
}

const splitTokens = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((s) => String(s).trim()).filter(Boolean))]
  }
  if (value && typeof value === 'object') return []
  const raw = String(value || '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.map((s) => String(s).trim()).filter(Boolean))]
    }
  } catch (_err) {
    // comma-separated string
  }
  return [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await resolveTable(queryInterface, CATEGORIES)
    if (!table) return
    const desc = await queryInterface.describeTable(table)

    if (!desc.keywords) {
      await queryInterface.addColumn(table, 'keywords', {
        type: Sequelize.JSON,
        allowNull: true,
      })
    }

    if (desc.ondcCategory) {
      const rows = await queryInterface.sequelize.query(
        `SELECT id, ondcCategory, keywords FROM \`${table}\``,
        { type: QueryTypes.SELECT },
      )
      for (const row of rows) {
        const merged = [...new Set([...splitTokens(row.keywords), ...splitTokens(row.ondcCategory)])]
        if (!merged.length) continue
        await queryInterface.sequelize.query(
          `UPDATE \`${table}\` SET keywords = :keywords WHERE id = :id`,
          { replacements: { keywords: JSON.stringify(merged), id: row.id } },
        )
      }
      // Keep ondcCategory until rows have been read into keywords. Dropping it
      // here hid tags the admin UI no longer SELECTs.
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await resolveTable(queryInterface, CATEGORIES)
    if (!table) return
    const desc = await queryInterface.describeTable(table)

    if (!desc.ondcCategory) {
      await queryInterface.addColumn(table, 'ondcCategory', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    }

    const rows = await queryInterface.sequelize.query(
      `SELECT id, keywords FROM \`${table}\``,
      { type: QueryTypes.SELECT },
    )
    for (const row of rows) {
      const list = splitTokens(row.keywords)
      if (!list.length) continue
      await queryInterface.sequelize.query(
        `UPDATE \`${table}\` SET ondcCategory = :ondcCategory WHERE id = :id`,
        { replacements: { ondcCategory: list.join(' , '), id: row.id } },
      )
    }
  },
}
