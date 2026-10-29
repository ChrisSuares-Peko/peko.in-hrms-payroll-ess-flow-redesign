const fs = require('fs')
const path = require('path')

const ENTITY_PATH = path.join(__dirname, '..', 'corporateCardAdminApplication.js')
const MIGRATIONS_DIR = path.join(__dirname, '..', '..', '..', 'migrations')

const entitySource = fs.readFileSync(ENTITY_PATH, 'utf8')
const migrationSource = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.js'))
    .map((file) => fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
    .join('\n')

// upsertByCorporate writes through Model#update / Model#create, and both silently ignore keys the
// model does not declare. A column that exists in only one of these two places is therefore either a
// lost write or a broken query, with no error either way.
const WRITTEN_COLUMNS = [
    'kybStatus',
    'kybReference',
    'businessType',
    'agreementSignMethod',
    'esignStatus',
    'esignReference',
    'cardSchemeId',
    'svcCardNumber',
    'virtualAccount',
    'metadata',
]

describe('corporateCardAdminApplications columns', () => {
    it.each(WRITTEN_COLUMNS)('%s is declared on the model', (column) => {
        expect(entitySource).toContain(`${column}:`)
    })

    it.each(WRITTEN_COLUMNS)('%s is created by a migration', (column) => {
        expect(migrationSource).toContain(column)
    })
})
