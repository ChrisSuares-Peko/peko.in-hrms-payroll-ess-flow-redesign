const PRESETS = require('./cardRolePresets.json')

const ROLE_NAMES = { ADMIN: 'Admin', EMPLOYEE: 'Employee' }
const DEFAULT_ROLE_NAME = PRESETS.defaultRoleName
const CATALOGUE_VERSION = PRESETS.version

const clone = (value) => JSON.parse(JSON.stringify(value))

const servicesOf = (tree) => (Array.isArray(tree?.services) ? tree.services : [])
const categoriesOf = (service) => (Array.isArray(service?.categories) ? service.categories : [])
const permissionsOf = (category) => (Array.isArray(category?.permissions) ? category.permissions : [])

const eachPermission = (tree) =>
    servicesOf(tree).flatMap((s) => categoriesOf(s).flatMap((c) => permissionsOf(c)))

const ALL_KEYS = new Set(eachPermission(PRESETS.catalogue).map((p) => p.key))

const PRESET_BY_NAME = new Map(PRESETS.roles.map((r) => [r.roleName, r]))

const resolveRoleName = (raw) => {
    const name = typeof raw === 'string' ? raw.trim() : ''
    return name === ROLE_NAMES.ADMIN ? ROLE_NAMES.ADMIN : ROLE_NAMES.EMPLOYEE
}

const getRolePreset = (roleName) => {
    const preset = PRESET_BY_NAME.get(resolveRoleName(roleName))
    return {
        roleName: preset.roleName,
        description: preset.description ?? null,
        actsAsCorporateAdmin: preset.actsAsCorporateAdmin === true,
        permissionKeys: new Set(preset.permissions.filter((key) => ALL_KEYS.has(key))),
    }
}

const actsAsCorporateAdmin = (roleName) => getRolePreset(roleName).actsAsCorporateAdmin

const hasPermission = (roleName, key) => getRolePreset(roleName).permissionKeys.has(key)

const buildRoleTree = (roleName) => {
    const { permissionKeys } = getRolePreset(roleName)
    const tree = { version: CATALOGUE_VERSION, services: clone(PRESETS.catalogue.services) }
    eachPermission(tree).forEach((p) => { p.enabled = permissionKeys.has(p.key) })
    return tree
}

const countEnabled = (tree) => eachPermission(tree).filter((p) => p?.enabled === true).length

const enabledKeys = (tree) => eachPermission(tree).filter((p) => p?.enabled === true).map((p) => p.key)

const listRolePresets = () =>
    PRESETS.roles.map((r) => {
        const permissions = buildRoleTree(r.roleName)
        return {
            roleName: r.roleName,
            description: r.description ?? null,
            isDefault: r.roleName === DEFAULT_ROLE_NAME,
            actsAsCorporateAdmin: r.actsAsCorporateAdmin === true,
            permissionCount: countEnabled(permissions),
            permissions,
        }
    })

const PERMISSIONS = {
    VIEW_MEMBERS: 'corporate_cards.view-members',
    ISSUE_CARDS: 'corporate_cards.issue-cards',
    ORDER_PHYSICAL: 'corporate_cards.order-physical-cards',
    SET_LIMITS: 'corporate_cards.set-limits',
    TERMINATE_CARDS: 'corporate_cards.terminate-cards',
    VIEW_WALLET: 'corporate_cards.view-wallet',
    VIEW_STATEMENT: 'corporate_cards.view-statement',
    EXPORT_STATEMENT: 'corporate_cards.export-statement',
    RECORD_ENTRIES: 'corporate_cards.record-entries',
    VIEW_AUDIT: 'corporate_cards.view-audit',
}
Object.entries(PERMISSIONS).forEach(([name, key]) => {
    if (!ALL_KEYS.has(key)) throw new Error(`PERMISSIONS.${name} references unknown key '${key}'`)
})

module.exports = {
    ROLE_NAMES,
    PERMISSIONS,
    DEFAULT_ROLE_NAME,
    CATALOGUE_VERSION,
    ALL_KEYS,
    eachPermission,
    resolveRoleName,
    getRolePreset,
    actsAsCorporateAdmin,
    hasPermission,
    buildRoleTree,
    countEnabled,
    enabledKeys,
    listRolePresets,
}
