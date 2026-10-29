const asyncHandler = require('../middlewares/async')
const { getValue, setValue, client } = require('../utils/cacheDataMethods')
const { FORBIDDEN, SILENT } = require('../utils/responseCodes')
const { EMPLOYEE_SERVICE, resolveServiceRole } = require('../constants/employeeServices')
const { roleInService, holdsService } = require('../models/use-cases/serviceMembership')
const { findOrCreateOwnerProfile } = require('../models/use-cases/ownerCardholderProfile')

/**
 * The Admin/Employee mode an EMPLOYEE acts in, within Corporate Cards.
 *
 * An employee whose card role is Admin holds one identity that has to do two jobs: run the programme, and
 * carry their own card. This is that switch, and it is deliberately narrow:
 *
 *  - It is confined to EMPLOYEE sessions. The account holder has a second IDENTITY for this — their Corporate
 *    account is the admin view and their Employee account the cardholder view — so nothing here touches them.
 *  - It can only ever REDUCE authority. Switching down to Employee is always allowed; switching up requires
 *    the assigned card role to actually be Admin, checked here and never trusted from the client.
 *  - It lives on the session, not the database, so a fresh login starts in the assigned role.
 *  - `subCorporateId` is NOT written to the blob. That key means "this caller is a sub-user" to hundreds of
 *    call sites in other services, and a Corporate Cards toggle must not re-scope the rest of the platform.
 *    The blob carries only `activeSubRole`, which only Corporate Cards reads.
 */
const OWNER_SERVICE_LABEL = EMPLOYEE_SERVICE.CORPORATE_CARDS
const CARDHOLDER_ROLE = resolveServiceRole(OWNER_SERVICE_LABEL, null)
const ADMIN_ROLE = resolveServiceRole(OWNER_SERVICE_LABEL, 'Admin')

const isOwnerSession = (user) => user?.role === 'CORPORATE'

const membershipsOf = (user) => ({ permission: user?.serviceMemberships })

/** The card role this employee was ASSIGNED, failing closed the way the server's own resolver does. */
const assignedRoleFor = (user) =>
    resolveServiceRole(OWNER_SERVICE_LABEL, roleInService(membershipsOf(user), OWNER_SERVICE_LABEL))

/**
 * Who gets a choice: an employee holding this service whose assigned role is Admin.
 *
 * Not the account holder. Their Corporate account already IS the admin view, and giving them a mode here as
 * well would put the same person in two places at once.
 */
const canSwitch = (user) =>
    user?.role === 'USER'
    && holdsService(membershipsOf(user), OWNER_SERVICE_LABEL)
    && assignedRoleFor(user) === ADMIN_ROLE

/**
 * What the owner's employee row is built from.
 *
 * Defaults to the details they gave at REGISTRATION, so the row can be provisioned without asking them for
 * anything: `contactPersonName` is the "Full Name" field (the company name is a separate one) and `mobileNo`
 * is the handset they OTP-verified at sign-up and log in with. Both are personal and already verified, which
 * is exactly what Pine Labs KYC needs.
 *
 * The body still wins when supplied, so a caller can correct either value the first time — after that the row
 * exists and both are ignored.
 */
const ownerProfileInput = (req) => ({
    credentialId: req.user?.id,
    corporateUserId: req.user?.corporateId,
    name: req.body?.name || req.user?.contactPersonName,
    email: req.user?.email,
    mobileNo: req.body?.mobileNo || req.user?.mobileNo,
    serviceLabel: OWNER_SERVICE_LABEL,
    role: CARDHOLDER_ROLE,
})

const forbidden = (res, message) => res.status(403).json({
    status: false,
    message,
    data: {},
    responseCode: FORBIDDEN,
})

/**
 * GET /api/v1/user/active-role — the modes this session may act in.
 *
 * `modes` is empty for everyone without a real choice, so the header renders nothing rather than a
 * one-option control.
 */
exports.availableRoles = asyncHandler(async (req, res) => {
    const switchable = canSwitch(req.user)
    const assigned = assignedRoleFor(req.user)

    return res.status(200).json({
        status: true,
        message: 'Available roles fetched.',
        data: {
            assignedRole: switchable ? assigned : null,
            activeRole: switchable
                ? resolveServiceRole(OWNER_SERVICE_LABEL, req.user?.activeSubRole ?? assigned)
                : null,
            modes: switchable ? [ADMIN_ROLE, CARDHOLDER_ROLE] : [],
        },
        responseCode: '000',
    })
})

/**
 * POST /api/v1/user/active-role — Body: { role: 'Admin' | 'Employee' }
 *
 * Rewrites the active mode on the session blob in place, keeping the same session id and tokens: the caller is
 * the same person, only their authority changes. Every service reads `activeSubRole` out of the forwarded
 * userdata header, so it takes effect on the next request without a re-login.
 */
exports.switchRole = asyncHandler(async (req, res) => {
    const target = typeof req.body?.role === 'string' ? req.body.role.trim() : ''
    if (target !== ADMIN_ROLE && target !== CARDHOLDER_ROLE) {
        return res.status(400).json({
            status: false,
            message: `Role must be one of: ${ADMIN_ROLE}, ${CARDHOLDER_ROLE}.`,
            data: {},
            responseCode: '001',
        })
    }

    if (!canSwitch(req.user)) {
        return forbidden(res, 'Switching roles is not available on this account.')
    }

    // The authorization boundary. Switching DOWN is always allowed; switching UP requires the assigned role to
    // actually be Admin, so a tampered body can only ever reduce what the caller can do.
    if (target === ADMIN_ROLE && assignedRoleFor(req.user) !== ADMIN_ROLE) {
        return forbidden(res, 'You do not have access to this role.')
    }

    const sessionId = req.headers.sessionid
    const userId = req.user?.id
    if (!sessionId || !userId) {
        return res.status(400).json({
            status: false,
            message: 'Session context is missing.',
            data: {},
            responseCode: '001',
        })
    }

    const key = `userData_${userId}_${sessionId}`
    const raw = await getValue(key)
    if (!raw) {
        return res.status(401).json({
            status: false,
            message: 'Your session has expired. Please sign in again.',
            data: {},
            responseCode: '002',
        })
    }

    const session = JSON.parse(raw)
    session.activeSubRole = target

    // Reuse the blob's REMAINING lifetime — a mode switch must not silently renew the session. A negative TTL
    // means no expiry set (-1) or already gone (-2); in the -1 case keep it unexpiring rather than inventing a
    // shorter life for it.
    let ttl = null
    try {
        const remaining = await client.ttl(key)
        if (remaining > 0) ttl = remaining
        else if (remaining === -1) ttl = Infinity
    } catch (err) {
        // Redis hiccup reading the TTL: fall through to a bounded default rather than failing the switch.
    }
    await setValue(key, ttl ?? 3600, JSON.stringify(session))

    return res.status(200).json({
        status: true,
        message: target === ADMIN_ROLE ? 'Switched to Admin.' : 'Switched to Employee.',
        data: { assignedRole: assignedRoleFor(req.user), activeRole: target },
        responseCode: '000',
    })
})

/**
 * POST /api/v1/user/active-role/cardholder-profile
 *
 * Creates the OWNER's employee row without switching to it, so the People screen can list the account holder
 * as its first member — and let them complete KYC — while they stay on the Corporate account.
 *
 * The identity switch creates the same row as a side effect of switching; this is that operation asked for on
 * its own. Idempotent: an existing row is returned untouched.
 *
 * Owner-only. An employee has no second identity to create — their row IS their identity — and must never be
 * able to mint one for the account holder.
 */
exports.createOwnerCardholderProfile = asyncHandler(async (req, res) => {
    // SILENT, not FORBIDDEN: the People screen calls this on mount to make sure the owner's row exists, so
    // every non-owner admin who opens that screen hits this refusal without having asked for anything. It is
    // a normal state for them, and a permission toast is noise they cannot act on. The two refusals above
    // answer a deliberate click, so they keep telling the user why.
    if (!isOwnerSession(req.user)) {
        return res.status(403).json({
            status: false,
            message: 'Only the account owner has a cardholder profile of their own.',
            data: {},
            responseCode: SILENT,
        })
    }

    // Supplying details means this is an explicit provision, where the UI actually collected a name and
    // mobile. A bare call is the People screen ensuring the row exists on mount.
    const suppliedDetails = !!(req.body?.name || req.body?.mobileNo)

    const result = await findOrCreateOwnerProfile(ownerProfileInput(req))
    if (!result?.ok) {
        // Only a caller that asked for something is being told to fix something. For the blind ensure call,
        // "the registration details cannot build a row" is a normal state, not a failure, and a validation
        // message on a screen that asked for nothing is noise the account holder cannot act on.
        if (!suppliedDetails) {
            return res.status(200).json({
                status: true,
                message: 'Cardholder profile is not set up yet.',
                data: { id: null, created: false, needsDetails: true },
                responseCode: '000',
            })
        }

        return res.status(400).json({
            status: false,
            message: result?.message || 'Could not set up your cardholder profile. Please try again.',
            data: {},
            responseCode: '001',
        })
    }

    return res.status(200).json({
        status: true,
        message: 'Cardholder profile is ready.',
        data: {
            id: String(result.profile?.id),
            name: result.profile?.name,
            mobileNo: result.profile?.mobileNo,
            role: CARDHOLDER_ROLE,
            created: result.created === true,
        },
        responseCode: '000',
    })
})

exports.ownerProfileInput = ownerProfileInput
