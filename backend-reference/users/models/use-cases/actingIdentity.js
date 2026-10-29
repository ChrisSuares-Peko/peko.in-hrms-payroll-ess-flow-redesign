const { findOne: findOneCorporateUser } = require("./corporateUser");
const { findOneByCredentialId } = require("./user");
const { findOneSubCorporateByCredentialId } = require("./subCorporateUser");

const { actingCredentialId } = require("../../utils/actingCredential");

const isActiveEmployee = (row) =>
    !!row && row.isActive !== false && row.isDeleted !== true;

/**
 * The same conditions login refuses a sub-corporate on, asked before the identity is offered rather than
 * after it is chosen — a role in this list that login would then reject is a dead end the caller is sent to.
 */
const isActiveMember = (row) =>
    !!row
    && row.isDeleted !== true
    && row.status !== "INACTIVE"
    && Array.isArray(row.services)
    && row.services.length > 0;

/** The `corporateUsers.id` a sub-corporate row names, which it stores as the employer's CREDENTIAL id. */
const memberCorporateId = async (memberRow) => {
    if (!memberRow?.corporateCredentialID) return null;
    const corporate = await findOneCorporateUser({ id: memberRow.corporateCredentialID }, ["id"]);
    return corporate?.id ?? null;
};

/**
 * The identities one credential may act as.
 *
 * Three roles exist and they do not form a free graph:
 *
 * - CORPORATE  — the account holder. May also act as an employee of their own company. They are NOT offered
 *                the sub-corporate identity even where a row exists for them — the owner cardholder profile
 *                creates one naming their own credential as the employer — because switching into it would
 *                narrow the account holder to a member's service list for no gain.
 * - USER       — an employee. May additionally be invited as a sub-corporate member.
 * - SUB_USER   — a sub-corporate member. May additionally be invited as an employee.
 *
 * So the switchable pair is employee <-> sub-corporate, in both directions, and only where BOTH identities
 * were granted. Each is a separate invite, which is what `id` in each entry is: the row that invite created.
 *
 * Both identities must also name the same employer. The invite path already enforces that
 * (`identityLink.sameTenant` / `sameTenantAsMember`), so a mismatch here is a data fault rather than a
 * reachable state — it is still checked, because this is the function that hands out authority, and the
 * sub-corporate identity carries the employer's own credential.
 */
async function getAvailableRoles(credentialId) {
    const availableRoles = [];

    const corporateProfile = await findOneCorporateUser({ id: credentialId }, ["id"]);
    if (corporateProfile) {
        availableRoles.push({ role: "corporate", roleName: "Corporate", id: corporateProfile.id });
    }

    const employeeProfile = await findOneByCredentialId(credentialId);
    if (isActiveEmployee(employeeProfile)) {
        availableRoles.push({ role: "user", roleName: "Employee", id: employeeProfile.id });
    }

    if (corporateProfile) return availableRoles;

    const memberProfile = await findOneSubCorporateByCredentialId({ id: credentialId });
    if (!isActiveMember(memberProfile)) return availableRoles;

    if (isActiveEmployee(employeeProfile)) {
        const employerOfMember = await memberCorporateId(memberProfile);
        if (
            !employerOfMember
            || String(employerOfMember) !== String(employeeProfile.corporateUserId)
        ) {
            return availableRoles;
        }
    }

    availableRoles.push({
        role: "sub_corporate",
        roleName: "Sub Corporate",
        id: memberProfile.id,
    });

    return availableRoles;
}

module.exports = { actingCredentialId, getAvailableRoles };
