const disableServices = require("../models/entities/disabledService");
const serviceOperators = require("../models/entities/serviceOperator");
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

    const disabled = await disableServices.findOne({
      where: {
        credentialId,
        serviceStatus: false,
      },
      include: [
        {
          model: serviceOperators,
          where: { accessKey },
          attributes: [],
        },
      ],
      raw: true,
    });

    if (disabled) {
      return res.status(403).json({
        status: false,
        message: "This service is disabled for your account",
      });
    }

    next();
  });