const essUser = require("../entities/essUser");
const { customLog } = require("../../utils/loggerHelper");

/**
 * The employee row the paying person's corporate card is issued under.
 *
 * An employee session carries it as employeeProfileId. A corporate-owner session does not: the users service
 * attaches a profile only to employee logins, and the owner reaches their own card by switching identity, which
 * has no payment page. The owner's row is keyed on their credential, so it is looked up here. Never for a
 * sub-user: that session carries the parent's credential, and the owner's card is not theirs to spend.
 */
const resolveCardholderId = async (req) => {
  const user = req?.user || {};
  if (user.employeeProfileId) return user.employeeProfileId;
  if (String(user.role || "").toUpperCase() !== "CORPORATE" || user.subCorporateId) return null;
  if (!user.id) return null;
  try {
    const row = await essUser.findOne({ where: { credentialId: user.id, isDeleted: false }, attributes: ["id"] });
    return row?.id ?? null;
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "[Cardholder] Owner profile lookup failed", credentialId: user.id, error: error?.message });
    return null;
  }
};

module.exports = { resolveCardholderId };
