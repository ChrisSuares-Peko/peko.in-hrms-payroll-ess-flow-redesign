const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { getDocumentDecrypted } = require("../../utils/s3");
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
  const isAdmin = role.toLowerCase() === "SYSTEM_USER".toLowerCase();
  if (!(isSameEnvironment && (isAdmin ||(isSameRole && isSameUsername)))) {
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
