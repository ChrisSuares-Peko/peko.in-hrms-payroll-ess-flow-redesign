const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/error-response");
const { customLog } = require("../utils/loggerHelper");
const {
    createEmployeeIdentity,
    findUserAccountByEmail,
    findUserAccountById,
    resendUserPasswordEmail,
    updateUserById,
} = require("../models/use-cases/user");
const { grantEmployeeService } = require("../models/use-cases/employeeServiceGrant");
const { resolveInviteTarget, WANTS, ACTION } = require("../models/use-cases/identityLink");
const { resolveServicePermissionsForSession } = require("../models/use-cases/partnerPermission");
const { findOneCorporate } = require("../models/use-cases/corporateUser");
const { clampRequestedServices } = require("../utils/clampServiceAccess");
const { holdsService, grantService, revokeService } = require("../models/use-cases/serviceMembership");
const { revokeSessionService } = require("../services/authHelper");
const { EMPLOYEE_SERVICE, MEMBERSHIP_STATUS, rolesForService } = require("../constants/employeeServices");

const CARD_SERVICE_LABEL = EMPLOYEE_SERVICE.CORPORATE_CARDS;

/**
 * The Corporate Cards member invite.
 *
 * Deliberately separate from Settings → User Management: a card member is an EMPLOYEE identity (one credential
 * with role USER and a `users` row carrying the card role), not a sub-corporate. The two paths no longer share
 * an endpoint, a controller or a table.
 */
/**
 * The partner tree that licenses what this CORPORATE may grant.
 *
 * Resolved from the corporate, never from whoever is doing the inviting. `resolveServicePermissionsForSession`
 * falls back to looking the caller's credential up in `corporateUsers` when it carries no `registeredBy`, and an
 * employee Admin's credential owns no such row — so an unregistered-by-partner account would have found no
 * permissions and refused every invite its own admins made.
 */
const corporatePermissionSubject = async (req) => {
    if (req.user?.role === "CORPORATE") return req.user;
    const corporate = await findOneCorporate({ id: req.user?.corporateId }, ["id", "credentialId"]);
    if (!corporate?.credentialId) return null;
    return { registeredBy: req.user?.registeredBy, id: corporate.credentialId };
};

const resolveGrant = async (req) => {
    const subject = await corporatePermissionSubject(req);
    if (!subject) {
        return { error: "Unable to resolve service permissions for this account. Please contact support.", statusCode: 500 };
    }
    const partnerPermissionData = await resolveServicePermissionsForSession(subject, ["permissions"]);
    if (!partnerPermissionData || !Array.isArray(partnerPermissionData.permissions) || !partnerPermissionData.permissions.length) {
        return { error: "Unable to resolve service permissions for this account. Please contact support.", statusCode: 500 };
    }

    // Clamped against the partner tree exactly as the sub-corporate path is: the stored grant is trusted
    // downstream with no re-clamp, so a corporate must not be able to grant what its partner never licensed.
    const services = clampRequestedServices(
        [{ label: CARD_SERVICE_LABEL, hasAccess: true }],
        partnerPermissionData.permissions
    );
    if (!services.length) {
        return { error: "Corporate Cards is not available on your account.", statusCode: 400 };
    }
    return { licensed: true };
};

const parseRole = (body) => {
    const role = typeof body?.role === "string" ? body.role.trim() : "";
    return rolesForService(CARD_SERVICE_LABEL).includes(role) ? role : null;
};

exports.validateCardMember = asyncHandler(async (req, res, next) => {
    try {
        const outcome = await resolveInviteTarget({
            email: req.body?.email,
            mobileNo: req.body?.mobileNo,
            inviterCorporateUserId: req.user.corporateId,
            inviterCredentialId: req.user.id,
            inviterRegisteredBy: req.user.registeredBy,
            wants: WANTS.CARD_MEMBER,
        });
        if (outcome.action === ACTION.REJECT) return next(new ErrorResponse(outcome.message, 400));

        return res.status(200).json({
            status: true,
            message: "Validate successfully",
            data: { willUseExistingLogin: outcome.action === ACTION.LINK },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        return res.status(500).json({
            status: false,
            message: "Something went wrong while validating the member.",
            data: {},
            responseCode: "001",
        });
    }
});

exports.createCardMember = asyncHandler(async (req, res, next) => {
    try {
        const role = parseRole(req.body);
        if (!role) {
            return res.status(400).json({
                status: false,
                message: `Role must be one of: ${rolesForService(CARD_SERVICE_LABEL).join(", ")}.`,
                data: {},
                responseCode: "001",
            });
        }

        const { name, email, mobileNo, baseUrl } = req.body || {};
        const grant = await resolveGrant(req);
        if (grant.error) return next(new ErrorResponse(grant.error, grant.statusCode));

        // Already invited and still without a password: resend rather than issue a second identity.
        const existing = await findUserAccountByEmail(email);
        if (existing && !existing.credential?.password && holdsService(existing.userAccessService, CARD_SERVICE_LABEL)) {
            await resendUserPasswordEmail(existing, baseUrl);
            return res.status(200).json({
                status: true,
                message: "This member was already invited. The set-password invite has been resent.",
                data: { resent: true },
                responseCode: "000",
            });
        }

        const outcome = await resolveInviteTarget({
            email,
            mobileNo,
            inviterCorporateUserId: req.user.corporateId,
            inviterCredentialId: req.user.id,
            inviterRegisteredBy: req.user.registeredBy,
            wants: WANTS.CARD_MEMBER,
        });
        if (outcome.action === ACTION.REJECT) return next(new ErrorResponse(outcome.message, 400));

        if (outcome.action === ACTION.LINK) {
            const granted = await grantEmployeeService({
                credentialId: outcome.credentialId,
                existingUserId: outcome.adopt ? outcome.existingRow?.id : null,
                corporateUserId: req.user.corporateId,
                serviceLabel: CARD_SERVICE_LABEL,
                role,
                status: MEMBERSHIP_STATUS.ACTIVE,
            });
            if (!granted.ok) return next(new ErrorResponse(granted.message, 400));
            return res.status(200).json({
                status: true,
                message: "Card access added to this person's existing login.",
                data: { userId: String(granted.userId) },
                responseCode: "000",
            });
        }

        const member = await createEmployeeIdentity(
            {
                username: email,
                email,
                name,
                registeredBy: req.user.registeredBy,
                baseUrl,
                corporateEmail: req.user.email,
            },
            {
                name,
                email,
                mobileNo,
                corporateUserId: req.user.corporateId,
                employeeId: null,
                userAccessService: grantService(null, {
                    label: CARD_SERVICE_LABEL,
                    role,
                    status: MEMBERSHIP_STATUS.PENDING,
                }),
            }
        );
        if (!member) return next(new ErrorResponse("Something went wrong while inviting the member.", 500));

        return res.status(200).json({
            status: true,
            message: "Member invited successfully",
            data: { userId: String(member.id) },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        return res.status(500).json({
            status: false,
            message: "Something went wrong while inviting the member.",
            data: {},
            responseCode: "001",
        });
    }
});

/**
 * Resolves a card member scoped to the caller's corporate.
 *
 * Scoping here is the authorization boundary: without it an admin could resend an invite to, or revoke, an
 * employee of another company by guessing an id.
 */
/**
 * Whether this row is the account holder's own cardholder identity.
 *
 * The structural rule the directory already uses: the owner's `users` row is the one carrying the corporate's
 * OWN credential. Resolved from `corporateUsers` rather than from `req.user.id`, because that is the corporate's
 * credential only for a corporate session — an employee Admin carries their own, and comparing against it would
 * mark THEM the account holder.
 */
const isAccountOwnerRow = async (member, req) => {
    if (!member?.credentialId || !req.user?.corporateId) return false;
    const corporate = await findOneCorporate({ id: req.user.corporateId }, ['id', 'credentialId']);
    if (!corporate?.credentialId) return false;
    return String(corporate.credentialId) === String(member.credentialId);
};

const findScopedMember = async (req) => {
    const userId = String(req.params?.userId ?? '').trim();
    if (!/^\d+$/.test(userId)) return null;
    const member = await findUserAccountById(userId);
    if (!member || member.isDeleted === true) return null;
    if (String(member.corporateUserId) !== String(req.user.corporateId)) return null;
    if (!holdsService(member.userAccessService, CARD_SERVICE_LABEL)) return null;
    return member;
};

/**
 * POST /user/card-members/:userId/resend — reissue the set-password invite.
 *
 * Only for someone who has not set a password yet: once they have, resending would invalidate the password
 * they are using. That is a refusal the caller can act on, not a generic error.
 */
exports.resendCardMemberInvite = asyncHandler(async (req, res, next) => {
    try {
        const member = await findScopedMember(req);
        if (!member) return next(new ErrorResponse('Member not found.', 404));

        if (member.credential?.password) {
            return next(new ErrorResponse('This member has already set their password.', 400));
        }

        const sent = await resendUserPasswordEmail(member, req.body?.baseUrl);
        if (!sent) return next(new ErrorResponse('Could not resend the invite. Please try again.', 500));

        return res.status(200).json({
            status: true,
            message: 'The set-password invite has been resent.',
            data: { resent: true },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse('Something went wrong while resending the invite.', 500));
    }
});

/**
 * DELETE /user/card-members/:userId — revoke this member's Corporate Cards access.
 *
 * Revokes the MEMBERSHIP, never the login: the same person may hold Payroll on the same identity, and
 * deleting the row would take that with it. The entry is kept so records keyed on it still resolve.
 */
exports.revokeCardMember = asyncHandler(async (req, res, next) => {
    try {
        const member = await findScopedMember(req);
        if (!member) return next(new ErrorResponse('Member not found.', 404));

        await updateUserById(member.id, {
            userAccessService: revokeService(member.userAccessService, CARD_SERVICE_LABEL),
        });

        try {
            const revoked = await revokeSessionService(member.credentialId, CARD_SERVICE_LABEL);
            customLog(req?.LogTraceId, 'info', {
                message: 'Card access revoked on the removed member\'s live sessions',
                action: 'cardMember:sessionRevoked',
                userId: member.id,
                credentialId: member.credentialId,
                sessions: revoked,
            });
        } catch (error) {
            customLog(req?.LogTraceId, 'error', {
                message: 'Could not revoke card access on the removed member\'s live sessions',
                action: 'cardMember:sessionRevokeFailed',
                userId: member.id,
                credentialId: member.credentialId,
                error: error?.message,
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Card access removed.',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse('Something went wrong while removing card access.', 500));
    }
});

/**
 * PATCH /user/card-members/:userId — change a member's editable details.
 *
 * Writes the employee row and this service's own membership entry, nothing else. There is deliberately no
 * services array: a card member holds services through `userAccessService`, granted at invite and clamped
 * against the partner tree there, so this path never widens what they can reach.
 */
exports.updateCardMember = asyncHandler(async (req, res, next) => {
    try {
        const member = await findScopedMember(req);
        if (!member) return next(new ErrorResponse('Member not found.', 404));

        // The account holder's own cardholder row. Their details stay theirs to edit, so an admin acting for
        // them is refused the row outright rather than only the role — otherwise a body carrying just
        // { name, mobileNo } renames the person the issuer files KYC against.
        const targetsOwnerRow = await isAccountOwnerRow(member, req);
        if (targetsOwnerRow && req.user?.role !== 'CORPORATE') {
            return next(new ErrorResponse('Only the account owner can change their own details.', 403));
        }

        const { name, mobileNo, role } = req.body || {};
        const fields = {};

        if (name !== undefined) {
            const trimmed = String(name).trim();
            if (!trimmed) return next(new ErrorResponse('Please enter the name.', 400));
            if (trimmed.length > 50) {
                return next(new ErrorResponse('Name cannot exceed 50 characters.', 400));
            }
            fields.name = trimmed;
        }

        if (mobileNo !== undefined) {
            const trimmed = String(mobileNo).trim();
            if (!/^[6-9]\d{9}$/.test(trimmed)) {
                return next(new ErrorResponse('Please enter a valid 10-digit mobile number.', 400));
            }
            fields.mobileNo = trimmed;
        }

        if (role !== undefined) {
            // Nobody changes their own role: a demotion locks the last admin out, and the route becomes a
            // self-promotion path the moment a caller slips past the guard.
            if (String(member.id) === String(req.user?.employeeProfileId ?? '')) {
                return next(new ErrorResponse('You cannot change your own role.', 403));
            }
            // The self-check above cannot catch the account holder: a CORPORATE session carries no employee
            // profile id. Their admin authority comes from their credential, not from this column.
            if (targetsOwnerRow) {
                return next(new ErrorResponse('The account owner is always an Admin.', 400));
            }
            const requested = String(role).trim();
            if (!rolesForService(CARD_SERVICE_LABEL).includes(requested)) {
                return next(
                    new ErrorResponse(`Role must be one of: ${rolesForService(CARD_SERVICE_LABEL).join(', ')}.`, 400)
                );
            }
            fields.userAccessService = grantService(member.userAccessService, {
                label: CARD_SERVICE_LABEL,
                role: requested,
            });
        }

        if (!Object.keys(fields).length) {
            return res.status(200).json({
                status: true,
                message: 'Nothing to update.',
                data: {},
                responseCode: '000',
            });
        }

        await updateUserById(member.id, fields);

        return res.status(200).json({
            status: true,
            message: 'Member updated.',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse('Something went wrong while updating the member.', 500));
    }
});
