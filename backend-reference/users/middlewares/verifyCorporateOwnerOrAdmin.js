// Managing sub-corporate members is a corporate-admin capability: the corporate owner, or a member whose job
// role is Admin. Without this guard the sub-corporate routes were reachable by ANY authenticated sub-user —
// and because `req.user.id` for a sub-user is the PARENT corporate's credential id, the tenant WHERE clause
// downstream accepts them, so an Employee could edit (and promote) themselves.
//
// Mirrors corporateCard/utils/cardHelpers.js#isCorporateAdmin. There is no shared package between services, so
// the predicate is duplicated deliberately — keep the two in step.
const { FORBIDDEN, PERMISSION_DENIED } = require('../utils/responseCodes')
const { ROLE_NAMES, resolveSubCorporateRole } = require('../utils/subCorporateRoleNames')

const ADMIN_ROLE_NAME = ROLE_NAMES.ADMIN

// The owner's role is Admin by virtue of owning the account; everyone else carries theirs on their own row.
const activeRoleOf = (user) => (user?.role === 'CORPORATE'
    ? ROLE_NAMES.ADMIN
    : resolveSubCorporateRole(user?.subCorporateRole))

const verifyCorporateOwnerOrAdmin = (req, res, next) => {
    const { role } = req.user || {}
    const isCorporateAccount = role === 'CORPORATE' || role === 'CORPORATE_SUB_USER'

    if (isCorporateAccount && activeRoleOf(req.user) === ADMIN_ROLE_NAME) return next()

    // FORBIDDEN rather than the generic error code, so the frontend tells the caller they lack permission
    // instead of showing a bare failure they would read as a bug.
    return res.status(403).json({
        status: false,
        message: PERMISSION_DENIED,
        data: {},
        responseCode: FORBIDDEN,
    })
}

module.exports = { verifyCorporateOwnerOrAdmin, ADMIN_ROLE_NAME }
