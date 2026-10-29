const asyncHandler = require('../../middlewares/async')
const user = require('../entities/user')
const { EMPLOYEE_SERVICE, MEMBERSHIP_STATUS, resolveServiceRole } = require('../../constants/employeeServices')
const { grantService, holdsService } = require('./serviceMembership')

const CARD_SERVICE_LABEL = EMPLOYEE_SERVICE.CORPORATE_CARDS
const EMPLOYEE_ROLE = resolveServiceRole(CARD_SERVICE_LABEL, 'Employee')

/**
 * Grants Corporate Cards to one employee of one corporate.
 *
 * Scoped by corporate on purpose: the caller passes the approving admin's own corporateUserId and a row
 * belonging to anyone else is refused rather than silently granted. The role is fixed to Employee here —
 * an approval path must never be able to mint an Admin.
 *
 * Idempotent: re-approving someone who already holds the service is a no-op rather than a second entry.
 */
const grantCardMembership = asyncHandler(async ({ userId, corporateUserId }) => {
    const row = await user.findOne({ where: { id: userId } })
    if (!row) return { ok: false, reason: 'NOT_FOUND' }
    if (String(row.corporateUserId) !== String(corporateUserId)) return { ok: false, reason: 'FOREIGN_CORPORATE' }

    if (holdsService(row.userAccessService, CARD_SERVICE_LABEL)) {
        return { ok: true, userId: String(row.id), alreadyHeld: true }
    }

    await user.update(
        {
            userAccessService: grantService(row.userAccessService, {
                label: CARD_SERVICE_LABEL,
                role: EMPLOYEE_ROLE,
                status: MEMBERSHIP_STATUS.ACTIVE,
            }),
        },
        { where: { id: row.id } }
    )

    return { ok: true, userId: String(row.id), alreadyHeld: false }
})

module.exports = { grantCardMembership, CARD_SERVICE_LABEL }
