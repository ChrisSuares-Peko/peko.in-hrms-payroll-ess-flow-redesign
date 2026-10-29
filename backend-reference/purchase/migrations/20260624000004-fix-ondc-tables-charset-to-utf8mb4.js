'use strict'

// Fix: "Incorrect string value: '\xC2\xAE ...' for column 'shortDesc'".
// ONDC catalog text contains multibyte UTF-8 chars (®, ™, emojis...) that the
// table's charset can't store. Convert the ONDC tables to utf8mb4.

const TABLES = ['ondcProducts', 'userSearchOndcs']

module.exports = {
  async up(queryInterface) {
    const all = await queryInterface.showAllTables()
    for (const table of TABLES) {
      if (!all.includes(table)) continue
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      )
    }
  },

  async down() {
    return Promise.resolve()
  },
}
