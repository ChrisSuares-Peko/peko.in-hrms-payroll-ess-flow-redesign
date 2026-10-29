const { checkUserSubscriptionAccess } = require("../models/use-cases/subscription");
const asyncHandler = require("./async");

// LOCAL DEV ONLY — set SKIP_SUBSCRIPTION_ACCESS=true in your own untracked .env to
// bypass the subscription check entirely (e.g. while testing Turbo/Car Reports
// against an account with no active subscription seeded in your local DB). This repo's
// local .env sets NODE_ENV=production even for local dev, so there is no independent
// runtime guard beyond this flag itself — it relies entirely on the flag never being
// set in a real deployment's environment config. Never set this anywhere but your own
// machine; it removes real billing enforcement.
// const SKIP_SUBSCRIPTION_ACCESS = process.env.SKIP_SUBSCRIPTION_ACCESS === "true";

exports.requireSubscriptionAccess = (serviceAccessKey) =>
  asyncHandler(async (req, res, next) => {
    // if (SKIP_SUBSCRIPTION_ACCESS) {
    //   return next();
    // }

    const corporateId = req.user?.corporateId;
    const credentialId = req.user?.id;

    if (!corporateId || !credentialId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const subscription = await checkUserSubscriptionAccess({
      corporateId,
      serviceAccessKey,
      credentialId,
    });

    if (!subscription) {
      return res.status(403).json({
        status: false,
        message: "Active subscription required to access this service",
        data: {},
        responseCode: '004'
      });
    }

    req.subscription = subscription;

    next();
  });
