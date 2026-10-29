/**
 * Who may manage Corporate Cards members.
 *
 * Deliberately NOT `verifyCorporateOwnerOrAdmin`: that one admits a session by `subCorporateRole`, and a card
 * member has no sub-corporate row at all — so every employee Admin was refused the People screen's own
 * endpoints while the dashboard that hosts them let them in.
 *
 * Mirrors corporateCard/utils/cardHelpers.js#isCorporateAdmin, which decides the same thing for the 99 card
 * routes. There is no shared package between the two services, so the predicate is duplicated deliberately —
 * keep them in step. In particular the `activeSubRole` clamp: an Admin who has switched down to Employee to
 * work with their own card is acting as an Employee everywhere, here included.
 */
const { FORBIDDEN, PERMISSION_DENIED } = require('../utils/responseCodes')
const { EMPLOYEE_SERVICE, resolveServiceRole } = require('../constants/employeeServices')
const { holdsService, roleInService } = require('../models/use-cases/serviceMembership')

const CARD_SERVICE_LABEL = EMPLOYEE_SERVICE.CORPORATE_CARDS
const ADMIN_ROLE = resolveServiceRole(CARD_SERVICE_LABEL, 'Admin')

const membershipsOf = (user) => ({ permission: user?.serviceMemberships })

const actsAsCardAdmin = (user) => {
    // The account holder's authority comes from their credential, not from a membership row.
    if (user?.role === 'CORPORATE') return true
    if (user?.role !== 'USER') return false
    // An employee holds card authority only through a live membership AND an identity to exercise it as. One
    // granted another service must never resolve to Admin on the strength of that service's role field.
    if (!user?.employeeProfileId) return false
    if (!holdsService(membershipsOf(user), CARD_SERVICE_LABEL)) return false
    if (resolveServiceRole(CARD_SERVICE_LABEL, roleInService(membershipsOf(user), CARD_SERVICE_LABEL)) !== ADMIN_ROLE) {
        return false
    }
    return resolveServiceRole(CARD_SERVICE_LABEL, user?.activeSubRole ?? ADMIN_ROLE) === ADMIN_ROLE
}

const verifyCardMemberAdmin = (req, res, next) => {
    if (actsAsCardAdmin(req.user)) return next()

    return res.status(403).json({
        status: false,
        message: PERMISSION_DENIED,
        data: {},
        responseCode: FORBIDDEN,
    })
}

module.exports = { verifyCardMemberAdmin, actsAsCardAdmin }
