const {
    parsePaging,
    monthRangeUtc,
    currentMonthString,
    limitWindowRangeUtc,
    isRestrictedCategory,
    isAtmTransaction,
    toNum,
    round2,
    fmt,
    last4,
    describeCardSettingsChange,
    csvEscape,
    toCsv,
    escapeHtml,
    isAdmin,
    isCorporateAdmin,
    isCardholderSession,
    cardholderIdentity,
    isCorporateOwner,
    assignedRoleName,
    actsAsOwner,
    isSubAdminSelfTarget,
    actorCredentialId,
    actorDisplay,
    adminActor,
    cardholderActor,
    vendorResponseCode,
    safeDecrypt,
    safeAudit,
} = require('../cardHelpers')
const { decrypt } = require('../cardCrypto')
const { writeAudit } = require('../../models/use-cases/cardAuditLog')
const { customLog } = require('../loggerHelper')

jest.mock('../cardCrypto', () => ({ decrypt: jest.fn((v) => v), encrypt: jest.fn() }))
jest.mock('../../models/use-cases/cardAuditLog', () => ({ writeAudit: jest.fn() }))

describe('parsePaging', () => {
    it('defaults to page 1 / defaultSize when query is empty', () => {
        expect(parsePaging({ query: {} })).toEqual({ limit: 10, offset: 0 })
        expect(parsePaging({ query: {} }, 20)).toEqual({ limit: 20, offset: 0 })
    })

    it('computes offset from page and itemsPerPage', () => {
        expect(parsePaging({ query: { page: '3', itemsPerPage: '15' } })).toEqual({ limit: 15, offset: 30 })
    })

    it('clamps page < 1 to 1 and non-numeric itemsPerPage to the default', () => {
        expect(parsePaging({ query: { page: '0', itemsPerPage: 'x' } }, 25)).toEqual({ limit: 25, offset: 0 })
    })

    it('caps itemsPerPage at the MAX (100)', () => {
        expect(parsePaging({ query: { page: '1', itemsPerPage: '5000' } })).toEqual({ limit: 100, offset: 0 })
    })
})

describe('monthRangeUtc', () => {
    it('returns the half-open IST-anchored month window [start, nextMonthStart)', () => {
        expect(monthRangeUtc('2026-07')).toEqual({
            monthStart: new Date('2026-06-30T18:30:00.000Z'),
            monthEnd: new Date('2026-07-31T18:30:00.000Z'),
        })
    })

    it('rolls the year over for December', () => {
        expect(monthRangeUtc('2026-12')).toEqual({
            monthStart: new Date('2026-11-30T18:30:00.000Z'),
            monthEnd: new Date('2026-12-31T18:30:00.000Z'),
        })
    })

    it('excludes an early-IST-morning transaction on the 1st from the previous month (ADO 29082)', () => {
        const earlyIstMorning = new Date('2026-08-01T03:00:00.000+05:30')
        const july = monthRangeUtc('2026-07')
        const august = monthRangeUtc('2026-08')
        expect(earlyIstMorning >= july.monthEnd).toBe(true)
        expect(earlyIstMorning >= august.monthStart && earlyIstMorning < august.monthEnd).toBe(true)
    })
})

describe('currentMonthString', () => {
    it('is a valid YYYY-MM string', () => {
        expect(currentMonthString()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
    })
})

describe('limitWindowRangeUtc', () => {
    const wednesday = new Date('2026-07-08T15:30:00.000Z')

    it('returns the half-open UTC calendar day for "daily"', () => {
        expect(limitWindowRangeUtc('daily', wednesday)).toEqual({
            windowStart: new Date('2026-07-08T00:00:00.000Z'),
            windowEnd: new Date('2026-07-09T00:00:00.000Z'),
        })
    })

    it('returns a Monday-start, 7-day UTC window for "weekly"', () => {
        expect(limitWindowRangeUtc('weekly', wednesday)).toEqual({
            windowStart: new Date('2026-07-06T00:00:00.000Z'),
            windowEnd: new Date('2026-07-13T00:00:00.000Z'),
        })
    })

    it('returns the IST-anchored calendar-month window for "monthly"', () => {
        expect(limitWindowRangeUtc('monthly', wednesday)).toEqual({
            windowStart: new Date('2026-06-30T18:30:00.000Z'),
            windowEnd: new Date('2026-07-31T18:30:00.000Z'),
        })
    })

    it('falls back to monthly for a null/unrecognized frequency', () => {
        expect(limitWindowRangeUtc(null, wednesday)).toEqual({
            windowStart: new Date('2026-06-30T18:30:00.000Z'),
            windowEnd: new Date('2026-07-31T18:30:00.000Z'),
        })
        expect(limitWindowRangeUtc('yearly', wednesday)).toEqual({
            windowStart: new Date('2026-06-30T18:30:00.000Z'),
            windowEnd: new Date('2026-07-31T18:30:00.000Z'),
        })
    })
})

describe('isRestrictedCategory', () => {
    const restricted = [
        { category: 'Food & Beverage', mccs: ['5811', '5812'] },
        { category: 'Lodging & Hotels', mccs: ['7011'] },
    ]

    it('matches when the mcc is in one of the stored categories\' mccs (coerced to string)', () => {
        expect(isRestrictedCategory(restricted, '5811')).toBe(true)
        expect(isRestrictedCategory(restricted, 5811)).toBe(true)
        expect(isRestrictedCategory(restricted, '7011')).toBe(true)
    })

    it('does not match an mcc absent from every category', () => {
        expect(isRestrictedCategory(restricted, '9999')).toBe(false)
    })

    it('is false for an empty or missing restrictedCategories list', () => {
        expect(isRestrictedCategory([], '5811')).toBe(false)
        expect(isRestrictedCategory(null, '5811')).toBe(false)
        expect(isRestrictedCategory(undefined, '5811')).toBe(false)
    })

    it('is false when the transaction carries no mcc at all', () => {
        expect(isRestrictedCategory(restricted, undefined)).toBe(false)
        expect(isRestrictedCategory(restricted, null)).toBe(false)
    })

    it('ignores a legacy bare-string entry rather than matching or throwing', () => {
        expect(isRestrictedCategory(['Food & Beverage'], '5811')).toBe(false)
    })

    it('is false when a category entry has an empty mccs array (unfilled placeholder)', () => {
        expect(isRestrictedCategory([{ category: 'Food & Beverage', mccs: [] }], '5811')).toBe(false)
    })
})

describe('isAtmTransaction', () => {
    it('is true for transactionMode 5, numeric or string', () => {
        expect(isAtmTransaction(5)).toBe(true)
        expect(isAtmTransaction('5')).toBe(true)
    })

    it('is false for any other transactionMode', () => {
        expect(isAtmTransaction(2)).toBe(false)
        expect(isAtmTransaction('1')).toBe(false)
    })

    it('is false for undefined/null (no transactionMode on the payload)', () => {
        expect(isAtmTransaction(undefined)).toBe(false)
        expect(isAtmTransaction(null)).toBe(false)
    })
})

describe('toNum / round2 / fmt / last4', () => {
    it('toNum coerces, keeping null for null/undefined only', () => {
        expect(toNum(null)).toBeNull()
        expect(toNum(undefined)).toBeNull()
        expect(toNum('123.5')).toBe(123.5)
        expect(toNum(0)).toBe(0)
    })

    it('round2 rounds to two decimals', () => {
        expect(round2('1.239')).toBe(1.24)
        expect(round2(10)).toBe(10)
    })

    it('fmt renders Indian-grouped numbers, 0 for null/undefined', () => {
        expect(fmt(null)).toBe('0')
        expect(fmt(undefined)).toBe('0')
        expect(fmt(1000)).toBe('1,000')
        expect(fmt(100000)).toBe('1,00,000')
    })

    it('last4 returns the last four characters or null', () => {
        expect(last4('1234 56** **** 7890')).toBe('7890')
        expect(last4(null)).toBeNull()
    })
})

describe('describeCardSettingsChange', () => {
    const base = {
        cardLimit: 60000,
        perTxnLimit: 5000,
        limitFrequency: 'monthly',
        restrictedCategories: [],
        atmEnabled: false,
    }

    it('names only the per-transaction limit when that is the sole change (the reported bug)', () => {
        const desc = describeCardSettingsChange(base, { ...base, perTxnLimit: 8000 })
        expect(desc).toBe('Per-transaction limit ₹5,000 → ₹8,000')
        expect(desc).not.toMatch(/card limit/i)
    })

    it('reports the card limit change with Indian grouping', () => {
        expect(describeCardSettingsChange(base, { ...base, cardLimit: 100000 })).toBe(
            'Card limit ₹60,000 → ₹1,00,000'
        )
    })

    it('says "set to" when a per-transaction limit is added, "removed" when cleared', () => {
        expect(describeCardSettingsChange({ ...base, perTxnLimit: null }, { ...base, perTxnLimit: 3000 })).toBe(
            'Per-transaction limit set to ₹3,000'
        )
        expect(describeCardSettingsChange(base, { ...base, perTxnLimit: null })).toBe(
            'Per-transaction limit removed'
        )
    })

    it('reports a frequency change and treats a null old frequency as monthly (no spurious change)', () => {
        expect(describeCardSettingsChange(base, { ...base, limitFrequency: 'weekly' })).toBe(
            'Limit frequency monthly → weekly'
        )
        expect(describeCardSettingsChange({ ...base, limitFrequency: null }, { ...base, limitFrequency: 'monthly' })).toBe(
            'No changes to limits or controls'
        )
    })

    it('reports ATM enable/disable', () => {
        expect(describeCardSettingsChange(base, { ...base, atmEnabled: true })).toBe('ATM withdrawals enabled')
        expect(describeCardSettingsChange({ ...base, atmEnabled: true }, base)).toBe('ATM withdrawals disabled')
    })

    it('diffs restricted categories by name (object {category,mccs} shape) into added/removed', () => {
        const old = { ...base, restrictedCategories: [{ category: 'Lodging & Hotels', mccs: ['7011'] }] }
        const next = {
            ...base,
            restrictedCategories: [
                { category: 'Lodging & Hotels', mccs: ['7011'] },
                { category: 'Software & SaaS', mccs: ['7372'] },
            ],
        }
        expect(describeCardSettingsChange(old, next)).toBe('Restricted categories added: Software & SaaS')
        expect(describeCardSettingsChange(next, old)).toBe('Restricted categories removed: Software & SaaS')
    })

    it('joins multiple simultaneous changes with a semicolon', () => {
        const desc = describeCardSettingsChange(base, { ...base, cardLimit: 70000, atmEnabled: true })
        expect(desc).toBe('Card limit ₹60,000 → ₹70,000; ATM withdrawals enabled')
    })

    it('returns an explicit no-change line when nothing differs', () => {
        expect(describeCardSettingsChange(base, { ...base })).toBe('No changes to limits or controls')
    })

    it('only diffs fields present in BOTH snapshots (limits-only vs controls-only audits)', () => {
        const oldControls = { restrictedCategories: [], atmEnabled: false }
        const newControls = { restrictedCategories: [], atmEnabled: true }
        expect(describeCardSettingsChange(oldControls, newControls)).toBe('ATM withdrawals enabled')
    })
})

describe('csvEscape / toCsv', () => {
    it('leaves plain values unquoted and empties null/undefined', () => {
        expect(csvEscape('plain')).toBe('plain')
        expect(csvEscape(null)).toBe('')
        expect(csvEscape(undefined)).toBe('')
    })

    it('quotes and escapes values containing a comma, quote, or newline', () => {
        expect(csvEscape('a,b')).toBe('"a,b"')
        expect(csvEscape('quote"x')).toBe('"quote""x"')
        expect(csvEscape('line\nbreak')).toBe('"line\nbreak"')
    })

    it('joins header + rows with CRLF, escaping each cell', () => {
        expect(toCsv(['A', 'B'], [['1', '2'], ['x,y', 'z']])).toBe('A,B\r\n1,2\r\n"x,y",z')
    })
})

describe('role / actor helpers', () => {
    it('isAdmin is true only for role CORPORATE', () => {
        expect(isAdmin({ user: { role: 'CORPORATE' } })).toBe(true)
        expect(isAdmin({ user: { role: 'USER' } })).toBe(false)
        expect(isAdmin({})).toBe(false)
    })

    it('isCorporateAdmin also admits an employee whose card role is Admin', () => {
        expect(isCorporateAdmin({ user: { role: 'USER', employeeProfileId: 900, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } })).toBe(true)
        expect(isCorporateAdmin({ user: { role: 'CORPORATE' } })).toBe(true)
    })

    it('isCorporateAdmin fails closed for every other job role value', () => {
        ['Employee', 'admin', 'ADMIN', 'Accountant', '', null, undefined].forEach((subCorporateRole) => {
            expect(isCorporateAdmin({ user: { role: 'USER', subCorporateRole } })).toBe(false)
        })
    })

    it('a job role of Admin grants nothing to a credential that is not a sub-corporate', () => {
        expect(isCorporateAdmin({ user: { role: 'SYSTEM_USER', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } })).toBe(false)
    })

    it('isCardholderSession tracks the personal identity, independently of authority', () => {
        expect(isCardholderSession({ user: { role: 'USER', employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } })).toBe(true)
        expect(isCardholderSession({ user: { role: 'CORPORATE', corporateId: 42 } })).toBe(false)
    })

    // Every cardholder logs in as themselves, so the session credential is already their own.
    it('actorCredentialId is the session own credential', () => {
        expect(actorCredentialId({ user: { role: 'USER', id: 55, employeeProfileId: '99' } })).toBe(55)
        expect(actorCredentialId({ user: { role: 'CORPORATE', id: 7 } })).toBe(7)
        expect(actorCredentialId({ user: {} })).toBeNull()
    })

    describe('ESS-keyed cardholder sessions', () => {
        const essAdmin = { role: 'USER', id: 55, corporateId: 42, employeeProfileId: 900, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] }
        const essMember = { role: 'USER', id: 56, corporateId: 42, employeeProfileId: 901, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] }
        const payrollOnly = { role: 'USER', id: 57, corporateId: 42, employeeId: 'abc' }

        it('grants Admin authority to a card member whose card role is Admin', () => {
            expect(isCorporateAdmin({ user: essAdmin })).toBe(true)
        })

        it('withholds it from a card member whose role is Employee', () => {
            expect(isCorporateAdmin({ user: essMember })).toBe(false)
        })

        it('withholds it from a payroll-only employee, who holds no card membership', () => {
            expect(isCorporateAdmin({ user: payrollOnly })).toBe(false)
        })

        // Authority comes from a live membership, never from a role field on a session with no identity.
        it('never lets a role alone confer authority without an employee identity', () => {
            expect(isCorporateAdmin({ user: { role: 'USER', id: 57, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } })).toBe(false)
        })

        it('treats a card member as a cardholder session and a payroll-only employee as not', () => {
            expect(isCardholderSession({ user: essMember })).toBe(true)
            expect(isCardholderSession({ user: payrollOnly })).toBe(false)
        })

        it('resolves the identity to the employee own profile id', () => {
            expect(cardholderIdentity({ user: essMember })).toEqual({ userId: 901 })
            expect(cardholderIdentity({ user: { role: 'USER', employeeProfileId: '99' } })).toBeNull()
            expect(cardholderIdentity({ user: { role: 'CORPORATE', corporateId: 42 } })).toBeNull()
        })

        it('resolves a cardholder to their own credential', () => {
            expect(actorCredentialId({ user: essMember })).toBe(56)
        })

        it('drops authority when an Admin switches down to Employee', () => {
            expect(isCorporateAdmin({ user: { ...essAdmin, activeSubRole: 'Employee' } })).toBe(false)
        })

        it('is never treated as the corporate owner', () => {
            expect(isCorporateOwner({ user: essAdmin })).toBe(false)
            expect(actsAsOwner({ user: essAdmin })).toBe(false)
        })
    })

    // An employee whose card role is Admin may switch down to work with their own card. The mode is CLAMPED
    // to the assigned role, so it can only ever reduce authority.
    describe('the active mode is clamped to the assigned role', () => {
        const withRole = (role, extra = {}) => ({
            user: {
                role: 'USER',
                employeeProfileId: '99',
                serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role, status: 'ACTIVE' }],
                ...extra,
            },
        })

        it('grants authority on the assigned card role alone', () => {
            expect(isCorporateAdmin(withRole('Admin'))).toBe(true)
            expect(isCorporateAdmin(withRole('Employee'))).toBe(false)
        })

        it('lets an Admin reduce their own authority', () => {
            expect(isCorporateAdmin(withRole('Admin', { activeSubRole: 'Employee' }))).toBe(false)
        })

        // The clamp. The switch endpoint refuses this too; honouring it here would be a promotion by request.
        it('never lets an Employee claim Admin', () => {
            expect(isCorporateAdmin(withRole('Employee', { activeSubRole: 'Admin' }))).toBe(false)
        })

        it('falls back to the assigned role when no mode has been chosen', () => {
            expect(isCorporateAdmin(withRole('Admin'))).toBe(true)
        })

        // The account holder has no mode — their Corporate account IS the admin view, and their cardholder
        // view is a separate IDENTITY. Nothing they carry here is read.
        it('leaves the owner with full authority, whatever the session carries', () => {
            expect(isCorporateAdmin({ user: { role: 'CORPORATE' } })).toBe(true)
            expect(isCorporateAdmin({ user: { role: 'CORPORATE', activeSubRole: 'Employee' } })).toBe(true)
        })

        it('keeps the owner assigned Admin regardless of any membership on the session', () => {
            const owner = { user: { role: 'CORPORATE', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] } }
            expect(assignedRoleName(owner)).toBe('Admin')
            expect(isCorporateAdmin(owner)).toBe(true)
        })
    })

    describe('actsAsOwner', () => {
        it('is true for the account holder', () => {
            expect(actsAsOwner({ user: { role: 'CORPORATE' } })).toBe(true)
            expect(isCorporateOwner({ user: { role: 'CORPORATE' } })).toBe(true)
        })

        it('is never true for an employee, whatever their card role', () => {
            const admin = { user: { role: 'USER', employeeProfileId: '9', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } }
            expect(actsAsOwner(admin)).toBe(false)
        })
    })
    it('isCorporateOwner is true only for the real corporate credential', () => {
        expect(isCorporateOwner({ user: { role: 'CORPORATE' } })).toBe(true)
        expect(isCorporateOwner({ user: { role: 'USER', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } })).toBe(false)
    })

    describe('isSubAdminSelfTarget', () => {
        const subAdmin = { role: 'USER', id: 55, employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] }

        it('is true when an Admin targets their own record', () => {
            expect(isSubAdminSelfTarget({ user: subAdmin }, '99')).toBe(true)
            expect(isSubAdminSelfTarget({ user: subAdmin }, 99)).toBe(true)
        })

        // The rule is what stops an admin issuing and managing their own card.
        describe('given a row identity rather than a bare id', () => {
            const essAdmin = { role: 'USER', id: 55, employeeProfileId: 900, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] }

            it('is true when they target their own row', () => {
                expect(isSubAdminSelfTarget({ user: essAdmin }, { userId: 900 })).toBe(true)
            })

            it('is false when they target another member', () => {
                expect(isSubAdminSelfTarget({ user: essAdmin }, { userId: 901 })).toBe(false)
            })

            it('is false for a card member who is not an Admin', () => {
                const essMember = { role: 'USER', id: 56, employeeProfileId: 900, serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] }
                expect(isSubAdminSelfTarget({ user: essMember }, { userId: 900 })).toBe(false)
            })
        })

        it('reads a bare id as the cardholder id, which is what row.userId callers pass', () => {
            expect(isSubAdminSelfTarget({ user: subAdmin }, { userId: '99' })).toBe(true)
        })

        it('is false when they target another member', () => {
            expect(isSubAdminSelfTarget({ user: subAdmin }, '100')).toBe(false)
        })

        it('never restricts the corporate owner — they have authority over everyone', () => {
            expect(isSubAdminSelfTarget({ user: { role: 'CORPORATE', employeeProfileId: '99' } }, '99')).toBe(false)
        })

        it('is false for an Employee, whose own actions run through the cardholder paths anyway', () => {
            const employee = { role: 'USER', id: 56, employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] }
            expect(isSubAdminSelfTarget({ user: employee }, '99')).toBe(false)
        })

        it('is false for a missing target rather than matching loosely', () => {
            expect(isSubAdminSelfTarget({ user: subAdmin }, null)).toBe(false)
            expect(isSubAdminSelfTarget({ user: subAdmin }, undefined)).toBe(false)
        })
    })

    it('actorDisplay names the sub-user and their authority, not the corporate contact', () => {
        expect(actorDisplay({ user: { role: 'USER', employeeProfileId: '99', employeeName: ' Priya ', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] } }))
            .toBe('Priya (Admin)')
        expect(actorDisplay({ user: { role: 'USER', employeeProfileId: '99', employeeName: 'Priya', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] } }))
            .toBe('Priya (Cardholder)')
        expect(actorDisplay({ user: { role: 'CORPORATE', contactPersonName: 'Ravi' } })).toBe('Ravi (Admin)')
    })

    it('adminActor prefers contactPersonName, falling back to "Admin"', () => {
        expect(adminActor({ user: { contactPersonName: 'Ravi' } })).toBe('Ravi (Admin)')
        expect(adminActor({ user: {} })).toBe('Admin (Admin)')
    })

    it('cardholderActor trims the sub-corporate name, falling back to "Cardholder"', () => {
        expect(cardholderActor({ user: { employeeName: 'Acme ' } })).toBe('Acme (Cardholder)')
        expect(cardholderActor({ user: {} })).toBe('Cardholder (Cardholder)')
    })
})

describe('vendorResponseCode', () => {
    it('reads the numeric code from data, then error', () => {
        expect(vendorResponseCode({ data: { responseCode: '0' } })).toBe(0)
        expect(vendorResponseCode({ error: { responseCode: '11' } })).toBe(11)
    })

    it('is NaN when neither is present', () => {
        expect(Number.isNaN(vendorResponseCode({}))).toBe(true)
    })
})

describe('safeDecrypt', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns the decrypted value on success', () => {
        decrypt.mockReturnValueOnce('https://view')
        expect(safeDecrypt('cipher')).toBe('https://view')
    })

    it('degrades to null (never throws) when decryption fails', () => {
        decrypt.mockImplementationOnce(() => { throw new Error('bad key') })
        expect(safeDecrypt('cipher')).toBeNull()
    })
})

describe('safeAudit', () => {
    beforeEach(() => jest.clearAllMocks())

    it('writes the audit row on the happy path', async () => {
        writeAudit.mockResolvedValue({ id: 1 })

        await safeAudit('trace', { action: 'CARD_FROZEN' })

        expect(writeAudit).toHaveBeenCalledWith({ action: 'CARD_FROZEN' })
    })

    it('swallows a write failure (never fails the primary op) and logs it', async () => {
        writeAudit.mockRejectedValue(new Error('db down'))

        await expect(safeAudit('trace', { action: 'CARD_FROZEN' })).resolves.toBeUndefined()
        expect(customLog).toHaveBeenCalled()
    })
})
const { findCardholderById } = require('../../models/use-cases/cardUser')
const { resolveActingIdentity, ROLE } = require('../cardHelpers')

jest.mock('../../models/use-cases/cardUser', () => ({ findCardholderById: jest.fn() }))

const cardholderReq = (overrides = {}) => ({
    user: {
        role: 'USER',
        corporateId: 42,
        employeeProfileId: '99',
        employeeName: 'Jane Cardholder',
        employeeEmail: 'jane@example.com',
        serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
    },
    ...overrides,
})

const adminReq = (overrides = {}) => ({
    user: {
        role: 'CORPORATE',
        corporateId: 42,
        contactPersonName: 'Shyam Admin',
        email: 'shyam@example.com',
    },
    ...overrides,
})

const subAdminReq = (overrides = {}) => ({
    user: {
        role: 'USER',
        corporateId: 42,
        employeeProfileId: '77',
        employeeName: 'Priya Admin',
        employeeEmail: 'priya@peko.in',
        serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
        contactPersonName: 'Corporate Owner',
        email: 'owner@peko.in',
    },
    ...overrides,
})

const transaction = { id: 1, corporateId: 42, userId: '99' }

describe('resolveActingIdentity — cardholder callers', () => {
    beforeEach(() => jest.clearAllMocks())

    it('defaults to the cardholder\'s own identity when no role is supplied', async () => {
        const identity = await resolveActingIdentity(cardholderReq(), transaction, undefined)

        expect(identity).toEqual({
            role: ROLE.CARDHOLDER,
            userId: '99',
            name: 'Jane Cardholder',
            email: 'jane@example.com',
        })
        expect(findCardholderById).not.toHaveBeenCalled()
    })

    it('accepts an explicit, matching CARDHOLDER role (case-insensitive)', async () => {
        const identity = await resolveActingIdentity(cardholderReq(), transaction, 'cardholder')
        expect(identity.role).toBe(ROLE.CARDHOLDER)
    })

    it('rejects a cardholder passing role=ADMIN — never silently downgraded', async () => {
        const identity = await resolveActingIdentity(cardholderReq(), transaction, 'ADMIN')
        expect(identity).toEqual({ error: expect.any(String), statusCode: 403 })
    })

    it('rejects any other non-CARDHOLDER value from a cardholder', async () => {
        const identity = await resolveActingIdentity(cardholderReq(), transaction, 'SUPERUSER')
        expect(identity.statusCode).toBe(403)
    })
})

describe('resolveActingIdentity — admin callers', () => {
    beforeEach(() => jest.clearAllMocks())

    it('defaults to the admin\'s own identity when no role is supplied', async () => {
        const identity = await resolveActingIdentity(adminReq(), transaction, undefined)

        expect(identity).toEqual({
            role: ROLE.ADMIN,
            userId: 42,
            name: 'Shyam Admin',
            email: 'shyam@example.com',
        })
        expect(findCardholderById).not.toHaveBeenCalled()
    })

    it('accepts an explicit ADMIN role', async () => {
        const identity = await resolveActingIdentity(adminReq(), transaction, 'ADMIN')
        expect(identity.role).toBe(ROLE.ADMIN)
        expect(identity.userId).toBe(42)
    })

    it('resolves role=CARDHOLDER to the transaction\'s own cardholder, not the admin', async () => {
        findCardholderById.mockResolvedValue({ id: '99', name: 'Aarav Sharma', email: 'aarav@peko.in' })

        const identity = await resolveActingIdentity(adminReq(), transaction, 'CARDHOLDER')

        expect(findCardholderById).toHaveBeenCalledWith('99', expect.objectContaining({ user: expect.objectContaining({ role: 'CORPORATE' }) }))
        expect(identity).toEqual({
            role: ROLE.CARDHOLDER,
            userId: '99',
            name: 'Aarav Sharma',
            email: 'aarav@peko.in',
        })
    })

    it('is case-insensitive for role=cardholder too', async () => {
        findCardholderById.mockResolvedValue({ id: '99', name: 'Aarav Sharma', email: 'aarav@peko.in' })
        const identity = await resolveActingIdentity(adminReq(), transaction, 'cardholder')
        expect(identity.role).toBe(ROLE.CARDHOLDER)
    })

    it('attributes a sub-corporate Admin to THEMSELVES, not the corporate owner', async () => {
        const identity = await resolveActingIdentity(subAdminReq(), transaction, undefined)

        expect(identity).toEqual({
            role: ROLE.ADMIN,
            userId: '77',
            name: 'Priya Admin',
            email: 'priya@peko.in',
        })
        expect(identity.userId).not.toBe(42)
        expect(identity.name).not.toBe('Corporate Owner')
    })

    it('keeps the sub-corporate Admin identity on an explicit ADMIN role too', async () => {
        const identity = await resolveActingIdentity(subAdminReq(), transaction, 'ADMIN')
        expect(identity.userId).toBe('77')
    })

    it('still resolves role=CARDHOLDER to the transaction cardholder for a sub-corporate Admin', async () => {
        findCardholderById.mockResolvedValue({ id: '99', name: 'Aarav Sharma', email: 'aarav@peko.in' })

        const identity = await resolveActingIdentity(subAdminReq(), transaction, 'CARDHOLDER')

        expect(identity).toEqual({
            role: ROLE.CARDHOLDER,
            userId: '99',
            name: 'Aarav Sharma',
            email: 'aarav@peko.in',
        })
    })

    it('degrades to null name/email if the cardholder lookup finds nothing', async () => {
        findCardholderById.mockResolvedValue(null)
        const identity = await resolveActingIdentity(adminReq(), transaction, 'CARDHOLDER')
        expect(identity).toEqual({ role: ROLE.CARDHOLDER, userId: '99', name: null, email: null })
    })

    it('skips the lookup entirely when the transaction has no userId (unresolved card)', async () => {
        const identity = await resolveActingIdentity(adminReq(), { ...transaction, userId: null }, 'CARDHOLDER')
        expect(findCardholderById).not.toHaveBeenCalled()
        expect(identity).toEqual({ role: ROLE.CARDHOLDER, userId: null, name: null, email: null })
    })

    it('rejects a role value that is neither ADMIN nor CARDHOLDER', async () => {
        const identity = await resolveActingIdentity(adminReq(), transaction, 'SUPERUSER')
        expect(identity).toEqual({ error: expect.any(String), statusCode: 400 })
    })
})

describe('escapeHtml', () => {
    it('neutralises the characters that would inject markup into an email body', () => {
        expect(escapeHtml('<b>fraud</b>')).toBe('&lt;b&gt;fraud&lt;/b&gt;')
        expect(escapeHtml(`He said "hi" & left's`)).toBe('He said &quot;hi&quot; &amp; left&#39;s')
    })

    it('escapes the ampersand first so an entity is not double-encoded into nonsense', () => {
        expect(escapeHtml('&lt;')).toBe('&amp;lt;')
    })

    it('renders null and undefined as an empty string, never the literal words', () => {
        expect(escapeHtml(null)).toBe('')
        expect(escapeHtml(undefined)).toBe('')
    })

    it('leaves ordinary reason text untouched', () => {
        expect(escapeHtml('Employee exited: left mid-cycle')).toBe('Employee exited: left mid-cycle')
    })
})

/**
 * A sub-corporate login swaps the credential for the parent corporate's, so its session carries
 * role 'CORPORATE' too. Everything built on isCorporateOwner — the owner's standing, and the guard that
 * keeps a non-owner admin off the owner's own card — depended on telling the two apart.
 */
describe('a sub-corporate session is not the account owner', () => {
    const owner = { role: 'CORPORATE' }
    const subCorporate = { role: 'CORPORATE_SUB_USER', subCorporateId: 164 }

    it('answers false for isCorporateOwner', () => {
        expect(isCorporateOwner({ user: subCorporate })).toBe(false)
        expect(isCorporateOwner({ user: owner })).toBe(true)
    })

    it('answers false for actsAsOwner while still being an admin', () => {
        expect(actsAsOwner({ user: subCorporate })).toBe(false)
        expect(isCorporateAdmin({ user: subCorporate })).toBe(true)
        expect(actsAsOwner({ user: owner })).toBe(true)
    })

    // assignedRoleName keys off the session role alone, so the admin VIEW is unchanged — which is the
    // point: they keep the admin screens, they just stop inheriting the owner's standing.
    it('keeps the Admin role so the admin view is unchanged', () => {
        expect(assignedRoleName({ user: subCorporate })).toBe('Admin')
    })

    it('is not mistaken for the owner when the id is absent or zero', () => {
        expect(isCorporateOwner({ user: { role: 'CORPORATE', subCorporateId: null } })).toBe(true)
        expect(isCorporateOwner({ user: { role: 'CORPORATE', subCorporateId: '' } })).toBe(true)
    })
})
