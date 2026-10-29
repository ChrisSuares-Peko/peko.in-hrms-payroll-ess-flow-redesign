/**
 * The role vocabulary for sub-corporate members — the single copy in this service.
 *
 * `subCorporateUsers.role` used to be a free-text job title with no behaviour attached. It is now an
 * AUTHORIZATION input: corporateCard resolves it to a permission preset
 * (`corporateCard/utils/subCorporateRoles.js`) and 'Admin' grants corporate-wide card authority. An arbitrary
 * string must therefore never reach it — validate on every write path, not just the one named "update role".
 *
 * There is no shared package between services, so this mirrors corporateCard's ROLE_NAMES on purpose. Keep the
 * two in step; both fail closed (anything not exactly 'Admin' is Employee), so a drift loses authority rather
 * than granting it.
 */
const ROLE_NAMES = { ADMIN: 'Admin', EMPLOYEE: 'Employee' }

const SUB_CORPORATE_ROLE_NAMES = [ROLE_NAMES.ADMIN, ROLE_NAMES.EMPLOYEE]

const DEFAULT_SUB_CORPORATE_ROLE = ROLE_NAMES.EMPLOYEE

/** Exact 'Admin' after trimming wins; anything else — a legacy job title, empty, wrong case — is Employee. */
const resolveSubCorporateRole = (raw) =>
    (typeof raw === 'string' && raw.trim() === ROLE_NAMES.ADMIN ? ROLE_NAMES.ADMIN : ROLE_NAMES.EMPLOYEE)

module.exports = {
    ROLE_NAMES,
    SUB_CORPORATE_ROLE_NAMES,
    DEFAULT_SUB_CORPORATE_ROLE,
    resolveSubCorporateRole,
}
