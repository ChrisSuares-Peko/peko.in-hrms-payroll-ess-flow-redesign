const { isServiceEnabled } = require("../models/use-cases/disableService");
const asyncHandler = require("./async");


exports.checkServiceEnabled = (accessKey) =>
  asyncHandler(async (req, res, next) => {
    const credentialId = req.user?.id;

    if (!credentialId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const enabled = await isServiceEnabled(credentialId, accessKey);

    if (!enabled) {
      return res.status(403).json({
        status: false,
        message: "This service is disabled for your account",
      });
    }

    next();
  });