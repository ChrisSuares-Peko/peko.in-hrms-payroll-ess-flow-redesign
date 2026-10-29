const asyncHandler = require("../../middlewares/async");
const User = require("../entities/user");
const { grantService, holdsService, membershipFor } = require("./serviceMembership");
const { MEMBERSHIP_STATUS } = require("../../constants/employeeServices");

/**
 * The account owner's own employee identity, so they can hold what an employee holds.
 *
 * The owner logs in as CORPORATE, which is an account, not a person. A service that acts on behalf of an
 * individual — Corporate Cards issues a card in someone's name and files KYC against their handset — needs a
 * person. This gives the owner one employee row of their own, the same row every other employee has, rather
 * than a second kind of identity that every consumer then has to special-case.
 *
 * Provisioned from what registration already verified: `contactPersonName` ("Full Name", separate from the
 * company name) and the handset they OTP-verified at sign-up. Both are already personal and already verified,
 * which is what lets this be created without asking them for anything.
 *
 * Returns `{ ok: false, message }` on a refusal so the caller can surface it, rather than throwing.
 */
const findOwnerProfile = asyncHandler(async (credentialId) => {
    if (!credentialId) return null;
    return User.findOne({ where: { credentialId, isDeleted: false } });
});

const findOrCreateOwnerProfile = asyncHandler(async ({
    credentialId,
    corporateUserId,
    name,
    email,
    mobileNo,
    serviceLabel,
    role = null,
}) => {
    if (!credentialId || !corporateUserId) return { ok: false, message: "Session context is missing." };

    const existing = await findOwnerProfile(credentialId);
    if (existing) {
        // The owner's employee identity is a CARDHOLDER identity, always. Their admin authority comes from
        // `credentials.role` on the other identity, so a role stored here is corrected rather than honoured —
        // a row provisioned as Admin otherwise showed them the admin dashboard on the account whose whole
        // purpose is to carry their own card, and nothing would ever have moved it.
        const membership = membershipFor(existing.userAccessService, serviceLabel);
        const needsGrant = serviceLabel && !holdsService(existing.userAccessService, serviceLabel);
        const roleIsWrong = serviceLabel && membership && (membership.role ?? null) !== (role ?? null);

        if (needsGrant || roleIsWrong) {
            await User.update(
                {
                    userAccessService: grantService(existing.userAccessService, {
                        label: serviceLabel,
                        role,
                        status: MEMBERSHIP_STATUS.ACTIVE,
                    }),
                },
                { where: { id: existing.id } }
            );
            return { ok: true, profile: await findOwnerProfile(credentialId), created: false };
        }
        return { ok: true, profile: existing, created: false };
    }

    const personalName = typeof name === "string" ? name.trim() : "";
    const personalMobile = typeof mobileNo === "string" ? mobileNo.trim() : String(mobileNo ?? "").trim();
    // No fallback. A blank name used to become 'Account owner', which passes every length check downstream and
    // then fails Pine Labs video KYC — a failure that surfaces far from its cause.
    if (!personalName) return { ok: false, message: "Please enter your name as it appears on your ID." };
    if (!/^[6-9]\d{9}$/.test(personalMobile)) {
        return { ok: false, message: "Please enter a valid 10-digit mobile number." };
    }

    try {
        const profile = await User.create({
            name: personalName,
            email,
            mobileNo: personalMobile,
            credentialId,
            corporateUserId,
            employeeId: null,
            userAccessService: serviceLabel
                ? grantService(null, { label: serviceLabel, role, status: MEMBERSHIP_STATUS.ACTIVE })
                : { permission: [] },
        });
        return { ok: true, profile, created: true };
    } catch (error) {
        // Two concurrent first-switches can race between the find and the create. Re-read rather than
        // surfacing the error, so the caller still gets the one row that won.
        const raced = await findOwnerProfile(credentialId);
        if (raced) return { ok: true, profile: raced, created: false };
        return { ok: false, message: "Could not create your cardholder profile. Please try again." };
    }
});

module.exports = { findOwnerProfile, findOrCreateOwnerProfile };
