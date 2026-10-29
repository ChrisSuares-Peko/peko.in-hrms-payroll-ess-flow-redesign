const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { findOne: findOneServiceOperator } = require("../../models/use-cases/serviceOperator");
const { updateEsimProfileStatusByIccid } = require("../../models/use-cases/esimProfiles");
const operatorsData = require("../../utils/operatorsData.json");

const ESIM_ACCESS_KEY = operatorsData.eSIMTunz.accessKey
const VALID_PROFILE_STATES = new Set(["RELEASED", "INSTALLED", "DISABLED", "ERROR"]);

const parseWhitelistedIPs = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
  }
  return [];
};

exports.updateEsimStatusWebhook = asyncHandler(async (req, res, next) => {
  try {
    const { iccid, profileState, imsi, eid } = req.body;

    if (!iccid || !profileState) {
      return next(new ErrorResponse("iccid and profileState are required", 400));
    }

    const normalizedProfileState = String(profileState).toUpperCase();
    if (!VALID_PROFILE_STATES.has(normalizedProfileState)) {
      return next(new ErrorResponse("Invalid profileState", 400));
    }

    const clientIP = req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : req.ip;
    customLog(req?.LogTraceId, "info", {
      message: "eSIM webhook IP details",
      clientIP,
      reqIP: req.ip,
      remoteAddress: req.connection?.remoteAddress,
    });

    const serviceOperator = await findOneServiceOperator({ accessKey: ESIM_ACCESS_KEY });
    if (!serviceOperator || !serviceOperator.vendor) {
      return next(new ErrorResponse("eSIM service configuration not found", 400));
    }
    const routeVendorId = Number(req.params.vendorId);
    if (routeVendorId && Number(serviceOperator.vendor.id) !== routeVendorId) {
      return next(new ErrorResponse("Invalid vendor", 400));
    }

    const whitelistedIPs = parseWhitelistedIPs(serviceOperator.vendor.optional4);

    if (process.env.NODE_ENV === "production") {
      if (!clientIP || !whitelistedIPs.includes(clientIP)) {
        return next(new ErrorResponse("Access denied: IP address not whitelisted", 400));
      }
    }

    const updatedProfile = await updateEsimProfileStatusByIccid({
      iccid,
      status: normalizedProfileState,
    });

    if (!updatedProfile) {
      return next(new ErrorResponse("eSIM profile not found", 404));
    }

    customLog(req?.LogTraceId, "info", {
      message: "eSIM status updated from webhook",
      iccid,
      profileState: normalizedProfileState,
      imsi,
      eid,
      clientIP,
    });

    return res.status(200).json({
      status: true,
      data: {
        iccid,
        profileState: normalizedProfileState,
      },
      message: "eSIM status updated successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Error in eSIM status webhook",
      error: error?.message,
      data: error?.response?.data,
    });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});
