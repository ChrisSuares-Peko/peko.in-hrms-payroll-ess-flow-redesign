'use strict'

/**
 * Drops Office Supplies columns/tables left over after categoryId mapping and
 * classifier removal:
 *
 *   officeSupplyCategories — keywords, ondcMappedCategory
 *   ondcProducts           — categoryMatchScore, vendorSymbol, ondcCategory
 *   userSearchOndcs        — localCategory, ondcCategory
 *   officeSupplyQueryClassifiers — entire table
 *
 * Keep officeSupplyCategories.ondcCategory (the Peko ↔ seller categoryId map)
 * and ondcProducts.categoryId / category / localCategory (still used).
 *
 * House pattern: tables may be missing on a fresh DB (created later by
 * ensureTable). Every step is guarded. Boot-time WANTED_COLUMNS on the
 * entities must not list these fields, or they would be re-added after this.
 */

const CATEGORIES = ['officeSupplyCategories']
const PRODUCTS = ['ondcProducts']
const SEARCH = ['userSearchOndcs', 'userSearchOndc']
const CLASSIFIERS = ['officeSupplyQueryClassifiers', 'officeSupplyQueryClassifier']
const MAPPED_INDEX = 'office_supply_categories_mapped_category'

const resolveTable = async (queryInterface, candidates) => {
  const tables = await queryInterface.showAllTables()
  const wanted = candidates.map((n) => n.toLowerCase())
  return tables.find((t) => wanted.includes(String(t).toLowerCase())) || null
}

const dropIndexIfPresent = async (queryInterface, table, indexName) => {
  const existing = await queryInterface.showIndex(table)
  if (existing.some((i) => i.name === indexName)) {
    await queryInterface.removeIndex(table, indexName)
  }
}

const dropColumnsIfPresent = async (queryInterface, table, columns) => {
  const desc = await queryInterface.describeTable(table)
  for (const name of columns) {
    if (desc[name]) await queryInterface.removeColumn(table, name)
  }
}

const addColumnIfMissing = async (queryInterface, table, name, definition) => {
  const desc = await queryInterface.describeTable(table)
  if (!desc[name]) await queryInterface.addColumn(table, name, definition)
}

module.exports = {
  async up(queryInterface) {
    const classifiers = await resolveTable(queryInterface, CLASSIFIERS)
    if (classifiers) await queryInterface.dropTable(classifiers)

    const categories = await resolveTable(queryInterface, CATEGORIES)
    if (categories) {
      await dropIndexIfPresent(queryInterface, categories, MAPPED_INDEX)
      await dropColumnsIfPresent(queryInterface, categories, ['keywords', 'ondcMappedCategory'])
    }

    const products = await resolveTable(queryInterface, PRODUCTS)
    if (products) {
      await dropColumnsIfPresent(queryInterface, products, [
        'categoryMatchScore',
        'vendorSymbol',
        'ondcCategory',
      ])
    }

    const search = await resolveTable(queryInterface, SEARCH)
    if (search) {
      await dropColumnsIfPresent(queryInterface, search, ['localCategory', 'ondcCategory'])
    }
  },

  async down(queryInterface, Sequelize) {
    const categories = await resolveTable(queryInterface, CATEGORIES)
    if (categories) {
      await addColumnIfMissing(queryInterface, categories, 'keywords', {
        type: Sequelize.JSON,
        allowNull: true,
      })
      await addColumnIfMissing(queryInterface, categories, 'ondcMappedCategory', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      const existing = await queryInterface.showIndex(categories)
      const healed = await queryInterface.describeTable(categories)
      if (
        healed.ondcMappedCategory &&
        !existing.some((i) => i.name === MAPPED_INDEX)
      ) {
        await queryInterface.addIndex(categories, ['ondcMappedCategory'], {
          name: MAPPED_INDEX,
        })
      }
    }

    const products = await resolveTable(queryInterface, PRODUCTS)
    if (products) {
      await addColumnIfMissing(queryInterface, products, 'vendorSymbol', {
        type: Sequelize.TEXT,
        allowNull: true,
      })
      await addColumnIfMissing(queryInterface, products, 'ondcCategory', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      await addColumnIfMissing(queryInterface, products, 'categoryMatchScore', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
    }

    const search = await resolveTable(queryInterface, SEARCH)
    if (search) {
      await addColumnIfMissing(queryInterface, search, 'localCategory', {
        type: Sequelize.STRING,
        allowNull: true,
      })
      await addColumnIfMissing(queryInterface, search, 'ondcCategory', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    }

    const classifiers = await resolveTable(queryInterface, CLASSIFIERS)
    if (!classifiers) {
      await queryInterface.createTable('officeSupplyQueryClassifiers', {
        id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false, unique: true },
        categoryId: { type: Sequelize.BIGINT, allowNull: true },
        subcategoryId: { type: Sequelize.BIGINT, allowNull: true },
        keywords: { type: Sequelize.JSON, allowNull: true },
        enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      })
    }
  },
}
