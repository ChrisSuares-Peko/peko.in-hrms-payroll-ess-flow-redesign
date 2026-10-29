const PRESETS = require('../cardRolePresets.json')
const {
    ROLE_NAMES,
    DEFAULT_ROLE_NAME,
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
} = require('../cardRoles')

const SELF_SERVICE_KEYS = [
    'corporate_cards.view-own-cards',
    'corporate_cards.request-card',
    'corporate_cards.request-limit-increase',
    'corporate_cards.freeze-own-card',
    'corporate_cards.request-unfreeze',
    'corporate_cards.view-own-transactions',
    'corporate_cards.upload-own-receipts',
    'corporate_cards.complete-own-kyc',
]

describe('the presets file', () => {
    it('defines exactly two roles, with Employee as the default', () => {
        expect(PRESETS.roles.map((r) => r.roleName)).toEqual(['Admin', 'Employee'])
        expect(DEFAULT_ROLE_NAME).toBe(ROLE_NAMES.EMPLOYEE)
    })

    it('namespaces every catalogue key by its own service accessKey', () => {
        PRESETS.catalogue.services.forEach((service) => {
            service.categories.forEach((category) => {
                category.permissions.forEach((permission) => {
                    expect(permission.key.startsWith(`${service.accessKey}.`)).toBe(true)
                })
            })
        })
    })

    it('has globally unique catalogue keys', () => {
        const keys = eachPermission(PRESETS.catalogue).map((p) => p.key)
        expect(new Set(keys).size).toBe(keys.length)
    })

    it('references no key the catalogue does not define', () => {
        PRESETS.roles.forEach((role) => {
            role.permissions.forEach((key) => expect(ALL_KEYS.has(key)).toBe(true))
        })
    })

    it('lists no duplicate keys within a role', () => {
        PRESETS.roles.forEach((role) => {
            expect(new Set(role.permissions).size).toBe(role.permissions.length)
        })
    })

    it('gives every catalogue permission a label', () => {
        eachPermission(PRESETS.catalogue).forEach((p) => expect(p.label).toBeTruthy())
    })

    it('never stores `enabled` in the catalogue — it is derived, not data', () => {
        eachPermission(PRESETS.catalogue).forEach((p) => expect(p).not.toHaveProperty('enabled'))
    })
})

describe('resolveRoleName', () => {
    it('accepts the exact canonical name, trimming surrounding space', () => {
        expect(resolveRoleName('Admin')).toBe('Admin')
        expect(resolveRoleName('  Admin  ')).toBe('Admin')
    })

    it('resolves every other value to Employee, including near-misses in other cases', () => {
        ['admin', 'ADMIN', 'AdMiN', 'Administrator', 'Accountant', 'Finance Manager', '', '   ']
            .forEach((value) => expect(resolveRoleName(value)).toBe('Employee'))
    })

    it('resolves a non-string to Employee rather than throwing', () => {
        [null, undefined, 0, 1, {}, [], true, { toString: () => 'Admin' }]
            .forEach((value) => expect(resolveRoleName(value)).toBe('Employee'))
    })
})

describe('actsAsCorporateAdmin', () => {
    it('is true only for Admin', () => {
        expect(actsAsCorporateAdmin('Admin')).toBe(true)
        expect(actsAsCorporateAdmin('Employee')).toBe(false)
    })

    it('is false for every unrecognised value — an unknown role never gains authority', () => {
        ['admin', 'Administrator', '', null, undefined, {}]
            .forEach((value) => expect(actsAsCorporateAdmin(value)).toBe(false))
    })
})

describe('buildRoleTree', () => {
    it('enables every catalogue permission for Admin', () => {
        expect(countEnabled(buildRoleTree('Admin'))).toBe(ALL_KEYS.size)
    })

    it('enables exactly the self-service permissions for Employee', () => {
        expect(enabledKeys(buildRoleTree('Employee')).sort()).toEqual([...SELF_SERVICE_KEYS].sort())
    })

    it('gives Employee no permission scoped to anyone else, so the split is not just a label', () => {
        const employeeKeys = enabledKeys(buildRoleTree('Employee'))
        expect(employeeKeys).not.toContain('corporate_cards.view-cards')
        expect(employeeKeys).not.toContain('corporate_cards.view-transactions')
        expect(employeeKeys).not.toContain('corporate_cards.issue-cards')
        expect(employeeKeys).not.toContain('corporate_cards.record-entries')
        expect(employeeKeys).not.toContain('corporate_cards.view-roles')
    })

    it('returns the COMPLETE catalogue either way, so a disabled permission is explicitly off', () => {
        expect(eachPermission(buildRoleTree('Employee'))).toHaveLength(ALL_KEYS.size)
        expect(eachPermission(buildRoleTree('Admin'))).toHaveLength(ALL_KEYS.size)
    })

    it('falls back to the Employee tree for an unrecognised role', () => {
        expect(enabledKeys(buildRoleTree('Accountant')).sort()).toEqual([...SELF_SERVICE_KEYS].sort())
    })

    it('hands out a fresh copy, so one caller cannot mutate the catalogue for the next', () => {
        const first = buildRoleTree('Employee')
        first.services[0].categories[0].permissions[0].enabled = false
        first.services[0].categories[0].permissions[0].label = 'tampered'

        const second = buildRoleTree('Employee')
        expect(second.services[0].categories[0].permissions[0].enabled).toBe(true)
        expect(second.services[0].categories[0].permissions[0].label).not.toBe('tampered')
    })
})

describe('hasPermission', () => {
    it('answers per role', () => {
        expect(hasPermission('Admin', 'corporate_cards.issue-cards')).toBe(true)
        expect(hasPermission('Employee', 'corporate_cards.issue-cards')).toBe(false)
        expect(hasPermission('Employee', 'corporate_cards.view-own-cards')).toBe(true)
    })

    it('is false for a key outside the catalogue', () => {
        expect(hasPermission('Admin', 'corporate_cards.delete-everything')).toBe(false)
        expect(hasPermission('Admin', 'issue-cards')).toBe(false)
    })
})

describe('getRolePreset', () => {
    it('drops a key the catalogue does not define instead of trusting the file blindly', () => {
        const preset = getRolePreset('Admin')
        preset.permissionKeys.forEach((key) => expect(ALL_KEYS.has(key)).toBe(true))
    })
})

describe('listRolePresets', () => {
    it('returns both roles with full trees and a matching count', () => {
        const rows = listRolePresets()

        expect(rows.map((r) => r.roleName)).toEqual(['Admin', 'Employee'])
        rows.forEach((row) => {
            expect(row.permissionCount).toBe(countEnabled(row.permissions))
            expect(row.description).toBeTruthy()
        })
    })

    it('flags Employee as the default and Admin as the one with corporate authority', () => {
        const rows = listRolePresets()
        const byName = Object.fromEntries(rows.map((r) => [r.roleName, r]))

        expect(byName.Employee.isDefault).toBe(true)
        expect(byName.Admin.isDefault).toBe(false)
        expect(byName.Admin.actsAsCorporateAdmin).toBe(true)
        expect(byName.Employee.actsAsCorporateAdmin).toBe(false)
    })
})
