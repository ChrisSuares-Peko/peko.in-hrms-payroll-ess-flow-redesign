'use strict'

module.exports = {
    async up(queryInterface) {
        const tables = await queryInterface.showAllTables()
        const names = new Set(tables.map((t) => (typeof t === 'string' ? t : t.tableName)))
        const sharedSignature = ['corporateUsers', 'credentials', 'subCorporateUsers'].filter((t) => names.has(t))
        if (sharedSignature.length) {
            throw new Error(
                `This database contains shared tables (${sharedSignature.join(', ')}) — it looks like the shared peko DB. ` +
                'corporateCard must run on its own dedicated database; fix DATABASE_NAME/DATABASE_HOST in .env.'
            )
        }
    },

    async down() {},
}
