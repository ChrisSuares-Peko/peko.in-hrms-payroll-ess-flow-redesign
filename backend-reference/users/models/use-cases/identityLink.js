const asyncHandler = require("../../middlewares/async");
const credential = require("../entities/credential");
const corporateUser = require("../entities/corporateUser");
const SubCorporateUsers = require("../entities/subCorporateUsers");
const User = require("../entities/user");
const { findUserExist } = require("./subCorporateUser");
const { holdsService } = require("./serviceMembership");
const { EMPLOYEE_SERVICE } = require("../../constants/employeeServices");

const WANTS = { ESS: "ess", MEMBER: "member", CARD_MEMBER: "cardMember" };
const ACTION = { CREATE: "CREATE", LINK: "LINK", REJECT: "REJECT" };

const TAKEN_MESSAGE = "The email address is already associated with another account.";

const reject = (message = TAKEN_MESSAGE) => ({ action: ACTION.REJECT, message });

const normaliseEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const sameTenant = (rowCorporateUserId, inviterCorporateUserId) =>
    rowCorporateUserId !== null
    && rowCorporateUserId !== undefined
    && String(rowCorporateUserId) === String(inviterCorporateUserId);

/**
 * Whether a sub-corporate row belongs to the inviting corporate.
 *
 * `subCorporateUsers` has no `corporateUserId` — it names its employer by `corporateCredentialID`, the
 * corporate's CREDENTIAL id. Comparing the column that does not exist read `undefined` every time, so the
 * guard failed closed on everyone and a corporate could not grant card access to its own existing member.
 */
const sameTenantAsMember = asyncHandler(async (memberRow, inviterCorporateUserId) => {
    const stored = memberRow?.corporateCredentialID;
    if (stored === null || stored === undefined || stored === "") return false;
    const corporate = await corporateUser.findOne({
        where: { id: inviterCorporateUserId },
        attributes: ["credentialId"],
    });
    if (!corporate?.credentialId) return false;
    return String(stored) === String(corporate.credentialId);
});

exports.WANTS = WANTS;
exports.ACTION = ACTION;

exports.resolveInviteTarget = asyncHandler(async ({
    email,
    mobileNo,
    inviterCorporateUserId,
    inviterCredentialId,
    inviterRegisteredBy,
    wants,
}) => {
    const address = normaliseEmail(email);
    if (!address) return reject("Please provide a valid email address.");
    if (!inviterCorporateUserId || !inviterCredentialId) return reject("Session context is missing.");
    if (wants !== WANTS.ESS && wants !== WANTS.MEMBER && wants !== WANTS.CARD_MEMBER) return reject();

    const existingCredential = await credential.findOne({ where: { email: address } });

    if (!existingCredential) {
        const duplicate = await findUserExist({ email, mobileNo });
        if (duplicate.exist) return reject(duplicate.message);
        return { action: ACTION.CREATE };
    }

    if (existingCredential.role === "SYSTEM_USER") return reject();
    if (String(existingCredential.registeredBy || "") !== String(inviterRegisteredBy || "")) return reject();

    const ownsCorporate = await corporateUser.findOne({
        where: { credentialId: existingCredential.id },
        attributes: ["id"],
    });
    if (ownsCorporate && String(existingCredential.id) !== String(inviterCredentialId)) return reject();

    const essRow = await User.findOne({ where: { credentialId: existingCredential.id } });
    const memberRow = await SubCorporateUsers.findOne({
        where: { credentialId: existingCredential.id, isDeleted: false },
    });

    // A corporate-cards member IS an employee row, so an address that already has one is adopted rather than
    // refused: the same person gains a card role on the identity they already sign in with.
    if (wants === WANTS.CARD_MEMBER) {
        if (essRow) {
            if (!sameTenant(essRow.corporateUserId, inviterCorporateUserId)) return reject();
            if (essRow.isActive === false || essRow.isDeleted === true) return reject();
            return { action: ACTION.LINK, credentialId: existingCredential.id, existingRow: essRow, adopt: true };
        }
        // A credential with no employee row — a sub-corporate member of this corporate, say. Their card
        // identity is granted on the login they already have, never on a second one.
        if (memberRow && !(await sameTenantAsMember(memberRow, inviterCorporateUserId))) return reject();
        return { action: ACTION.LINK, credentialId: existingCredential.id, existingRow: memberRow || null };
    }

    if (wants === WANTS.ESS) {
        // An essRow already holding Payroll is a genuine duplicate invite. An essRow created by another
        // service (e.g. a Corporate Cards member with no Payroll grant yet) is adopted instead, the same way
        // the CARD_MEMBER branch above adopts an existing ESS identity.
        if (essRow) {
            if (holdsService(essRow.userAccessService, EMPLOYEE_SERVICE.PAYROLL)) return reject();
            if (essRow.isActive === false || essRow.isDeleted === true) return reject();
            if (!sameTenant(essRow.corporateUserId, inviterCorporateUserId)) return reject();
            return { action: ACTION.LINK, credentialId: existingCredential.id, existingRow: essRow, adopt: true };
        }
        if (!memberRow) return reject();
        if (!(await sameTenantAsMember(memberRow, inviterCorporateUserId))) return reject();
        return { action: ACTION.LINK, credentialId: existingCredential.id, existingRow: memberRow };
    }

    if (String(existingCredential.id) === String(inviterCredentialId)) return reject();
    if (memberRow) return reject();
    if (!essRow) return reject();
    if (essRow.isActive === false || essRow.isDeleted === true) return reject();
    if (!sameTenant(essRow.corporateUserId, inviterCorporateUserId)) return reject();
    return { action: ACTION.LINK, credentialId: existingCredential.id, existingRow: essRow };
});
