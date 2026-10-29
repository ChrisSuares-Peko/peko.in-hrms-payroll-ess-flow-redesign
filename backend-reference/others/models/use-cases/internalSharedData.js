const { Op, fn, col, literal, where: sequelizeWhere } = require('sequelize')
const asyncHandler = require('../../middlewares/async')
const user = require('../entities/user')
const corporateUser = require('../entities/corporateUser')
const credential = require('../entities/credential')
const serviceOperator = require('../entities/serviceOperator')
const vendors = require('../entities/vendor')
const { findOne: findOneDisableService } = require('./disableService')
const { findOne: findOneCashback } = require('./cashback')
const { findAllActiveSubscriptions, findActiveIndividualBaseForService } = require('./subscription')

// Queries backing the /api/v1/internal shared-data API consumed by the corporateCard service (which
// lives on its own database and reaches shared tables only through these endpoints). Kept in one file
// so the internal surface is auditable in a single place.

const CORPORATE_ATTRS = ['id', 'companyName', 'contactPersonName', 'email', 'mobileNo']

// The service label is interpolated into SQL literals, so it is whitelisted to a safe character set
// (letters, digits, spaces, & . -) — reject anything else at the boundary.
const SERVICE_LABEL_PATTERN = /^[\w &.-]+$/
const isValidServiceLabel = (label) => typeof label === 'string' && SERVICE_LABEL_PATTERN.test(label)

const assertServiceLabel = (serviceLabel) => {
    if (!isValidServiceLabel(serviceLabel)) throw new Error('Invalid service label.')
    return serviceLabel
}

// An employee's services are entries on users.userAccessService.permission, one per service. Nothing here
// names a service: the label always arrives from the caller, so a service added tomorrow needs no column,
// no migration and no branch in this file.
//
// Matching in SQL (not post-fetch) keeps pagination and count correct. JSON_CONTAINS does partial object
// matching, so the same call filters on any subset of an entry's keys. MySQL 5.7+ required.
// Same enum the corporateCard membership system writes — see
// corporateCard/scripts/convert-one-subcorporate-to-employee.md. JSON.stringify below does not
// escape a single quote, and the result is interpolated into a single-quoted SQL literal, so an
// unvalidated status string can break out of it (e.g. status=')OR SLEEP(3)OR('). Whitelisting to
// this enum closes that off entirely, not just the one payload shape.
const VALID_MEMBERSHIP_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING']
const assertMembershipStatus = (status) => {
    if (status !== undefined && !VALID_MEMBERSHIP_STATUSES.includes(status)) {
        throw new Error('Invalid status.')
    }
    return status
}

const membershipFilter = (serviceLabel, extra = {}) => {
    if (extra.status !== undefined) assertMembershipStatus(extra.status)
    return sequelizeWhere(
        fn(
            'JSON_CONTAINS',
            fn('COALESCE', literal("JSON_EXTRACT(`userAccessService`, '$.permission')"), literal('JSON_ARRAY()')),
            literal(`'${JSON.stringify({ label: assertServiceLabel(serviceLabel), ...extra })}'`)
        ),
        1
    )
}

const serviceAccessFilter = (serviceLabel) => membershipFilter(serviceLabel, { hasAccess: true })

// Interpolated into a SQL literal alongside the label, so whitelisted rather than trusted.
const MEMBERSHIP_FIELDS = ['role', 'status', 'ref']
const assertMembershipField = (field) => {
    if (!MEMBERSHIP_FIELDS.includes(field)) throw new Error('Invalid membership field.')
    return field
}

// One field of the caller's own membership entry, projected so consumers keep a flat row shape. Located by
// JSON_SEARCH on the label rather than by position, because entry order is not stable.
//
// The JSON_TYPE guard is not defensive dressing: JSON_UNQUOTE of a JSON null yields the four-character STRING
// 'null', not SQL NULL. A membership stored with no role — which is every service whose vocabulary is empty,
// and any entry written by hand during the cardholder conversion — reached the People screen as a member whose
// role reads "null", and `?? ''` on the client cannot catch a string.
const membershipField = (serviceLabel, field) => {
    const path = 'CONCAT(SUBSTRING_INDEX(JSON_UNQUOTE(JSON_SEARCH('
        + `\`userAccessService\`, 'one', '${assertServiceLabel(serviceLabel)}', NULL, '$.permission[*].label'`
        + `)), '.label', 1), '.${assertMembershipField(field)}')`
    const extracted = `JSON_EXTRACT(\`userAccessService\`, ${path})`
    return literal(`(CASE WHEN JSON_TYPE(${extracted}) = 'NULL' THEN NULL ELSE JSON_UNQUOTE(${extracted}) END)`)
}

/**
 * The corporate OWNER's own employee row, identified STRUCTURALLY rather than by a stored flag.
 *
 * An invited employee is always given a brand-new credential, so their `credentialId` can never equal their
 * employer's. The owner's row is created against their EXISTING credential, so for that one row the two are
 * the same. Nothing to keep in sync, and no column added to a shared table.
 *
 * Correlated rather than parameterised so it composes into any WHERE without an id to interpolate.
 * Qualified with the define() name — a wrongly-aliased literal fails the WHOLE query with "Unknown column".
 */
const OWNER_ROW_SQL = '`user`.`credentialId` <=> (SELECT `credentialId` FROM `corporateUsers` WHERE `id` = `user`.`corporateUserId`)'
const IS_OWNER_ROW = literal(OWNER_ROW_SQL)
const IS_NOT_OWNER_ROW = literal(`NOT (${OWNER_ROW_SQL})`)

// Escape LIKE metacharacters (\ % _) so the input matches literally (value is also parameterized).
const escapeLike = (searchText) => searchText.trim().replace(/[\\%_]/g, '\\$&')

const SEARCHABLE_MEMBER_FIELDS = ['name', 'email']

/**
 * Whether this person has finished setting their password.
 *
 * DERIVED from the credential rather than stored on the membership, because it is a fact about the login and
 * not about the membership: nothing flips a stored invite flag when someone completes the reset, so it stayed
 * "PENDING" for ever and the People screen kept offering "Resend invitation" to people who had long since
 * signed in. Projected as a boolean — the hash itself never leaves this query.
 */
const HAS_SET_PASSWORD = literal(
    "(`credential`.`password` IS NOT NULL AND `credential`.`password` <> '')"
)

const memberAttrs = (serviceLabel) => [
    'id',
    'name',
    'email',
    'mobileNo',
    'createdAt',
    [membershipField(serviceLabel, 'role'), 'role'],
    [membershipField(serviceLabel, 'status'), 'status'],
    [HAS_SET_PASSWORD, 'hasSetPassword'],
]

// attributes: [] keeps the join available to HAS_SET_PASSWORD without selecting a single credential column.
// required: false so a member whose credential row is somehow missing still lists, rather than vanishing.
const CREDENTIAL_JOIN = [{ model: credential, attributes: [], required: false }]

// Scoped to the calling corporate — a batch can only ever resolve the caller's own members. Deleted rows are
// included deliberately: a departed employee's cards must stay resolvable.
const findCardUsersByIds = asyncHandler(async (ids, corporateId, serviceLabel) => {
    if (!ids.length) return []
    return user.findAll({
        where: { id: { [Op.in]: ids }, corporateUserId: corporateId },
        attributes: memberAttrs(serviceLabel),
        include: CREDENTIAL_JOIN,
        raw: true,
    })
})

/**
 * Ids of a corporate's employees whose name/email matches the search text — replaces the cross-table
 * $cardholder.name$/$cardholder.email$ joins corporateCard ran when it shared this database.
 *
 * Deleted members are deliberately INCLUDED (the old joins matched them, and a departed employee's cards and
 * requests must stay findable by name), and so is the OWNER: this backs the free-text cardholder search on
 * the Cards list and the approval queue, and the owner can hold a card and raise requests.
 *
 * Capped and ordered by id DESC so truncation is deterministic; `capped` tells the caller it is partial.
 */
const searchCardUserIds = asyncHandler(async ({ corporateId, searchText, fields, limit }) => {
    const searchFields = fields.filter((f) => SEARCHABLE_MEMBER_FIELDS.includes(f))
    const like = `%${escapeLike(searchText)}%`
    const matches = searchFields.map((field) => ({ [field]: { [Op.like]: like } }))

    const rows = await user.findAll({
        where: { corporateUserId: corporateId, [Op.or]: matches },
        attributes: ['id'],
        order: [['id', 'DESC']],
        limit: limit + 1,
        raw: true,
    })

    return { ids: rows.slice(0, limit).map((r) => String(r.id)), capped: rows.length > limit }
})

/**
 * Page of a corporate's employees holding the service, scoped by employer + not deleted.
 *
 * `ids`/`excludeIds` narrow the page to (or away from) specific ids — corporateCard resolves them from its
 * own KYC table for the kycStatus filter.
 */
const findAndCountCardUsers = asyncHandler(async ({
    corporateId, serviceLabel, status, searchText, ids, excludeIds, includeOwner = false, pinUserId, limit, offset,
}) => {
    // Interpolated into SQL, so it must be a bare positive integer and is dropped entirely otherwise. Tested
    // with a regex rather than parseInt, which truncates: parseInt('1; DROP TABLE x') is 1, so a malformed
    // value would silently pin a real but unintended row instead of being ignored.
    const pinnedRow = /^\d+$/.test(String(pinUserId ?? '')) && Number(pinUserId) > 0
        ? literal(`\`user\`.\`id\` = ${Number(pinUserId)}`)
        : null

    const whereClause = {
        corporateUserId: corporateId,
        isDeleted: false,
        // The People screen lists the account holder as its first member, so it opts in. Everything else —
        // notably the "Issue a card" picker, where the owner is not a valid target for a sub-admin — keeps
        // the default and never sees the row.
        [Op.and]: [
            status ? membershipFilter(serviceLabel, { hasAccess: true, status }) : serviceAccessFilter(serviceLabel),
            ...(includeOwner ? [] : [IS_NOT_OWNER_ROW]),
        ],
    }
    if (Array.isArray(ids) && ids.length) whereClause.id = { [Op.in]: ids }
    else if (Array.isArray(excludeIds) && excludeIds.length) whereClause.id = { [Op.notIn]: excludeIds }
    if (searchText && searchText.trim()) {
        const like = `%${escapeLike(searchText)}%`
        whereClause[Op.or] = [
            { name: { [Op.like]: like } },
            { email: { [Op.like]: like } },
            { mobileNo: { [Op.like]: like } },
        ]
    }

    return user.findAndCountAll({
        where: whereClause,
        include: CREDENTIAL_JOIN,
        // isAccountOwner ships with the row so no consumer has to re-derive the structural rule — and so the
        // frontend gates the destructive actions on it rather than on role === 'Admin', which a real member
        // can also carry. isSelf lets it suppress the actions nobody may aim at their own row (Remove,
        // Resend) and offer the one that is only theirs (start my KYC), without knowing the session's id.
        attributes: [
            ...memberAttrs(serviceLabel),
            [IS_OWNER_ROW, 'isAccountOwner'],
            ...(pinnedRow ? [[pinnedRow, 'isSelf']] : []),
        ],
        order: [
            ...(includeOwner ? [[IS_OWNER_ROW, 'DESC']] : []),
            ...(pinnedRow ? [[pinnedRow, 'DESC']] : []),
            ['createdAt', 'DESC'],
            ['id', 'DESC'],
        ],
        limit,
        offset,
        raw: true,
    })
})

/**
 * The members a KYC summary should count, with the mobile each one's KYC is filed under.
 *
 * Mobile ships alongside the id because cardholderKyc is unique on mobileNumber, not on the member id: one
 * human holding two cardholder identities shares ONE KYC row, and counting by id alone reports them
 * unverified. The People table already resolves by mobile, so the KPI must have the same key available or
 * the two disagree on the same screen.
 */
const listCardUserIdentities = asyncHandler(async ({ corporateId, serviceLabel, includeOwner = false }) =>
    user.findAll({
        // Follows the People screen: the KYC-summary KPI and the members table sit on the same dashboard, so
        // counting the account holder in one and not the other would show a visible off-by-one.
        where: {
            corporateUserId: corporateId,
            isDeleted: false,
            [Op.and]: includeOwner
                ? [serviceAccessFilter(serviceLabel)]
                : [serviceAccessFilter(serviceLabel), IS_NOT_OWNER_ROW],
        },
        attributes: ['id', 'mobileNo'],
        raw: true,
    }))

const listCardUserIds = asyncHandler(async (params) => {
    const rows = await listCardUserIdentities(params)
    return rows.map((r) => String(r.id))
})

// A member scoped to a corporate (+ not deleted + holds the service) — authorization-sensitive: the scope
// stops a corporate admin from acting on an id outside their corporate or without the service.
const findCardUserScoped = asyncHandler(async ({ userId, corporateId, serviceLabel }) =>
    user.findOne({
        where: {
            id: userId,
            corporateUserId: corporateId,
            isDeleted: false,
            [Op.and]: [serviceAccessFilter(serviceLabel)],
        },
        attributes: memberAttrs(serviceLabel),
        include: CREDENTIAL_JOIN,
        raw: true,
    }))

// The corporate OWNER's own employee row. Excluded from every member listing above on purpose, so this is
// the single place it is reachable — that is what lets the owner hold a card and complete KYC without
// appearing as a member or being counted toward seats. Null until they first switch to Employee.
const findOwnerProfile = asyncHandler(async ({ corporateId, serviceLabel }) =>
    user.findOne({
        where: { corporateUserId: corporateId, isDeleted: false, [Op.and]: [IS_OWNER_ROW] },
        attributes: memberAttrs(serviceLabel),
        include: CREDENTIAL_JOIN,
        raw: true,
    }))

// credential is included for its username (the corporate's Peko account number) — left outer since a
// corporate row could in theory be missing its credential.
const findCorporatesByIds = asyncHandler(async (ids) => {
    if (!ids.length) return []
    return corporateUser.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: CORPORATE_ATTRS,
        include: [{ model: credential, attributes: ['name', 'username'], required: false }],
        raw: true,
        nest: true,
    })
})

// Matches the admin search box's "name, full name or account number": companyName / contactPersonName
// live on corporateUser, the account number is the credential's username — joined in (LEFT, since a
// company/contact name match shouldn't be hidden by a missing credential).
const searchCorporateIdsByCompanyName = asyncHandler(async ({ searchText, limit }) => {
    const like = `%${escapeLike(searchText)}%`
    const rows = await corporateUser.findAll({
        where: {
            [Op.or]: [
                { companyName: { [Op.like]: like } },
                { contactPersonName: { [Op.like]: like } },
                sequelizeWhere(col('credential.username'), { [Op.like]: like }),
            ],
        },
        attributes: ['id'],
        include: [{ model: credential, attributes: [], required: false }],
        order: [['id', 'DESC']],
        limit: limit + 1,
        subQuery: false,
        raw: true,
    })
    const capped = rows.length > limit
    return { ids: rows.slice(0, limit).map((r) => String(r.id)), capped }
})

// "Pickable" corporates: a CORPORATE credential with a name (never sub-corporates / partners / system
// users), searchable by the credential's name / username / email. `excludeIds` lets corporateCard skip
// corporates that already have an application row (computed from its own database).
const pickableCredentialWhere = (searchText) => {
    const credentialWhere = { role: 'CORPORATE', name: { [Op.ne]: null } }
    if (searchText) {
        const like = `%${escapeLike(searchText)}%`
        credentialWhere[Op.or] = [
            { name: { [Op.like]: like } },
            { username: { [Op.like]: like } },
            { email: { [Op.like]: like } },
        ]
    }
    return credentialWhere
}

const searchPickableCorporates = asyncHandler(async ({ searchText, excludeIds, limit, offset = 0 }) => {
    const where = {}
    if (excludeIds.length) where.id = { [Op.notIn]: excludeIds }
    return corporateUser.findAll({
        where,
        attributes: CORPORATE_ATTRS,
        include: [{
            model: credential,
            attributes: ['name', 'username', 'email'],
            where: pickableCredentialWhere(searchText),
            required: true,
        }],
        order: [[credential, 'name', 'ASC']],
        limit,
        offset,
    })
})

const countPickableCorporates = asyncHandler(async () =>
    corporateUser.count({
        distinct: true,
        include: [{
            model: credential,
            attributes: [],
            where: { role: 'CORPORATE', name: { [Op.ne]: null } },
            required: true,
        }],
    }))

// serviceOperator + full vendor attributes (the generic others lookup omits healthUrl / optionals /
// vendorEmail, which corporateCard needs for Pine Labs vendor notification emails).
const findServiceOperatorFullVendor = asyncHandler(async (accessKey) =>
    serviceOperator.findOne({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl', 'optionals', 'vendorEmail', 'vendorName'],
        }],
        where: { accessKey },
        raw: true,
        nest: true,
    }))

// Entitlement-scoped service resolution — mirrors the fetchServiceDetails contract corporateCard ran
// locally: the corporate's ACTIVE package must include the service and it must not be disabled for the
// credential. Returns the merged serviceOperator + vendor + cashback details, or { error } on failure —
// callers gate with hasOwnProperty('error').
const resolveEntitlement = asyncHandler(async ({ credentialId, accessKey, corporateUserId }) => {
    const service = await findServiceOperatorFullVendor(accessKey)
    if (!service) {
        return { error: 'Service not available' }
    }

    const serviceOperatorId = service.id
    const isDisable = await findOneDisableService({ credentialId, serviceOperatorId })
    if (isDisable) {
        return { error: 'Service is disabled' }
    }

    // The reused legacy use-cases swallow DB errors (subscriptions → false, cashback → undefined
    // instead of null). An infrastructure failure must surface as a 5xx — never as a definitive
    // entitlement DENIAL, which the caller would cache and which bypasses its stale-if-down fallback.
    const allActiveSubscriptions = await findAllActiveSubscriptions({ corporateUserId })
    if (allActiveSubscriptions === false) {
        throw new Error('Failed to read active subscriptions for entitlement resolution')
    }
    const allActivePackageIds = (allActiveSubscriptions || []).map((subscription) => subscription.packageId)

    const individualBase = await findActiveIndividualBaseForService({ corporateUserId, serviceOperatorId })
    const individualCashback = individualBase
        ? await findOneCashback({ packageIds: [individualBase.packageId], serviceOperatorId })
        : null
    if (individualCashback === undefined) {
        throw new Error('Failed to read cashback row for entitlement resolution')
    }

    const cashback = individualCashback
        || await findOneCashback({ packageIds: allActivePackageIds, serviceOperatorId })
    if (cashback === undefined) {
        throw new Error('Failed to read cashback row for entitlement resolution')
    }
    if (!cashback) {
        return { error: 'Unable to process your request' }
    }
    delete cashback.id

    return { ...service, ...cashback }
})

module.exports = {
    SEARCHABLE_MEMBER_FIELDS,
    VALID_MEMBERSHIP_STATUSES,
    isValidServiceLabel,
    findCardUsersByIds,
    searchCardUserIds,
    findAndCountCardUsers,
    listCardUserIds,
    listCardUserIdentities,
    findCardUserScoped,
    findOwnerProfile,
    findCorporatesByIds,
    searchCorporateIdsByCompanyName,
    searchPickableCorporates,
    countPickableCorporates,
    findServiceOperatorFullVendor,
    resolveEntitlement,
}
