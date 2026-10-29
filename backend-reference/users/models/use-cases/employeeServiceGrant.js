const asyncHandler = require("../../middlewares/async");
const User = require("../entities/user");
const { grantService } = require("./serviceMembership");

/**
 * Grants one service to an employee identity, creating that identity if the login does not have one yet.
 *
 * Never a second credential — the whole point is that one person keeps one login, whichever service invited
 * them. Idempotent: re-inviting someone who already holds the service updates their role rather than
 * duplicating anything, and granting a second service leaves the first untouched.
 *
 * `serviceLabel` is the caller's, so this knows nothing about which services exist.
 */
const grantEmployeeService = asyncHandler(async ({
    credentialId,
    existingUserId,
    corporateUserId,
    serviceLabel,
    role = null,
    status,
    ref,
    profile = {},
}) => {
    if (!credentialId || !corporateUserId || !serviceLabel) {
        return { ok: false, message: "Session context is missing." };
    }

    const existing = existingUserId
        ? await User.findOne({ where: { id: existingUserId } })
        : await User.findOne({ where: { credentialId } });

    if (existing) {
        if (String(existing.corporateUserId) !== String(corporateUserId)) {
            return { ok: false, message: "The email address is already associated with another account." };
        }
        // Their name, mobile and any other service's reference stay as the employee record already has them —
        // this grants one service, it does not re-import someone's profile from an invite form.
        await User.update(
            { userAccessService: grantService(existing.userAccessService, { label: serviceLabel, role, status, ref }) },
            { where: { id: existing.id } }
        );
        return { ok: true, userId: existing.id, created: false };
    }

    try {
        const created = await User.create({
            ...profile,
            corporateUserId,
            credentialId,
            userAccessService: grantService(null, { label: serviceLabel, role, status, ref }),
        });
        return { ok: true, userId: created.id, created: true };
    } catch (error) {
        const raced = await User.findOne({ where: { credentialId } });
        if (raced) {
            await User.update(
                { userAccessService: grantService(raced.userAccessService, { label: serviceLabel, role, status, ref }) },
                { where: { id: raced.id } }
            );
            return { ok: true, userId: raced.id, created: false };
        }
        return { ok: false, message: "Could not grant access. Please try again." };
    }
});

module.exports = { grantEmployeeService };
