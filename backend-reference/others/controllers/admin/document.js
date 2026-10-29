const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { getDocumentDecrypted } = require("../../utils/s3");
const { resolvePartnerScope } = require("../../utils/partnerScope");
const { findByAnyField } = require("../../models/use-cases/credential");
const corporateUser = require("../../models/entities/corporateUser");
const { NODE_ENV } = process.env;

exports.getDocument = asyncHandler(async (req, res, next) => {
  const { docKey } = req.params;
  const { role, username } = req.user;
  if (!docKey) {
    return next(new ErrorResponse(`Document key is required`, 400));
  }

  const parts = docKey.split("/");

  // Ensure it has enough segments
  if (parts.length < 3) {
    return next(new ErrorResponse(`Invalid document`, 400));
  }

  const environment = parts[0]; // "staging"
  const fileRole = parts[1]; // "corporate"
  const fileUsername = parts[2]; // "100000560"

  const isSameEnvironment =
    environment?.toLowerCase() === NODE_ENV.toLowerCase();
  const isSameRole = fileRole?.toLowerCase() === role.toLowerCase();
  const isSameUsername =
    fileUsername?.toLowerCase() === username?.toLowerCase();
  // F-OTH-06: "is any system user" used to be treated as "may read any tenant's documents."
  // A platform-level admin (not locked to a single partner) keeps full access; a
  // partner-scoped admin may only read documents belonging to their own partner's tenant.
  let isAuthorizedAdmin = false;
  if (role.toLowerCase() === "SYSTEM_USER".toLowerCase()) {
    const scope = resolvePartnerScope(req);
    if (!scope.locked) {
      isAuthorizedAdmin = true;
    } else {
      // A corporate's partner affiliation lives on corporateUser.registeredBy, not
      // credential.registeredBy — the two are not kept in sync (confirmed: a real record
      // had credential.registeredBy = null while corporateUser.registeredBy = '1').
      const owner = await findByAnyField({ username: fileUsername });
      const ownerCorporate = owner
        ? await corporateUser.findOne({ where: { credentialId: owner.id }, attributes: ["registeredBy"] })
        : null;
      isAuthorizedAdmin = !!ownerCorporate && String(ownerCorporate.registeredBy) === String(scope.partnerId);
    }
  }
  if (!(isSameEnvironment && (isAuthorizedAdmin || (isSameRole && isSameUsername)))) {
    return next(
      new ErrorResponse(`You are not authorized to access this document`, 403)
    );
  }

  const result = await getDocumentDecrypted(docKey);
  if (!result) {
    return next(
      new ErrorResponse(`Something went wrong while fetching document`, 500)
    );
  }

  return res.status(200).json({
    status: true,
    data: result,
    message: "Fetched Document successfully",
    responseCode: "000",
  });
});
