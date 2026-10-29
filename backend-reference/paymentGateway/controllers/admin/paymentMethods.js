const asyncHandler = require("../../middlewares/async");
const { getPGMethods, createPGMethod, updatePGMethod } = require("../../models/use-cases/setting");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const paymentMethodUseCase = require("../../models/use-cases/paymentMethods");
const { getUserPaymentUsage } = require("../../models/use-cases/order");
const { getABiller } = require("../corporate/commonBillHandler");
const { GATEWAY_PROVIDERS, pickProviderCode } = require("../../constants/gatewayProviders");
const { resolveGatewayProviders } = require("../../utils/pgProvider");
const { inAppEligibility } = require("../../utils/corporateCardsClient");
const { CORPORATE_CARD_PAYMENT_METHOD } = require("../../constants/corporateCardPayment");
const { resolveCardholderId } = require("../../models/use-cases/cardholder");

const CARDHOLDER_REQUIRED = "Corporate card payments are available only to cardholders.";

// The card tile needs the cardholder's own card (last4, remaining limit) and whether it can pay at all. That
// lives in corporateCard, so it is fetched here, server-side, and the FE makes its one call as before.
const resolveCorporateCard = async (req, { partnerEnabled, globalEnabled }) => {
  if (!partnerEnabled || !globalEnabled) return { available: false, reason: null, card: null };
  const cardholderId = await resolveCardholderId(req);
  if (!cardholderId) return { available: false, reason: CARDHOLDER_REQUIRED, card: null };
  const eligibility = await inAppEligibility(
    { corporateId: req.user.corporateId, userId: cardholderId },
    { logTraceId: req?.LogTraceId }
  );
  if (!eligibility.ok) return { available: false, reason: eligibility.message || "Card service is unavailable", card: null };
  return {
    available: Boolean(eligibility.data?.available),
    reason: eligibility.data?.reason || null,
    card: eligibility.data?.card || null,
  };
};

exports.fetchAllAvailablePgMethodsCorporate = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const billerId = req.query.billerId ?? null;
    const paymentSummary = await getUserPaymentUsage({credentialId})
    let methods = await getPGMethods();

    if (!methods || !methods.details) {
      return next(new ErrorResponse("Unable to process your request at this moment", 400));
    }
    
    let paymentMethod = methods.details
    
    const registeredBy = req.user.registeredBy
    let serviceAccessKey = req.query.accessKey
    const result = await paymentMethodUseCase.findAllPaymentMethodForCorporate({ partnerId: registeredBy, accessKey: serviceAccessKey })
    const getPaymentLimits = (methodType) => {
      const entry = result.find(({ paymentMethod }) => paymentMethod === methodType);
      return {
        available: Boolean(entry),
        limits: entry?.limits || null,
      };
    };
    const normalizeLimits = (limits = {}) => ({
      limitPerTransaction: Number(limits.limitPerTransaction || 0),
      limitPerDay: Number(limits.limitPerDay || 0),
      limitPerMonth: Number(limits.limitPerMonth || 0),
    });
    const gatewayResult = getPaymentLimits("PAYMENT_GATEWAY");
    paymentMethod.isGatewayPaymentAvailable =
      gatewayResult.available && paymentMethod.isGatewayPaymentAvailable;
    if (gatewayResult.limits) {
      paymentMethod.gatewayLimit = normalizeLimits(gatewayResult.limits);
    }
    const gatewayProviders = await resolveGatewayProviders({ partnerId: registeredBy, accessKey: serviceAccessKey, rows: result });

    const walletResult = getPaymentLimits("WALLET");
    paymentMethod.isWalletPaymentAvailable =
      walletResult.available && paymentMethod.isWalletPaymentAvailable;
    if (walletResult.limits) {
      paymentMethod.walletLimit = normalizeLimits(walletResult.limits);
    }

    const corporateCardResult = getPaymentLimits(CORPORATE_CARD_PAYMENT_METHOD);
    const corporateCard = await resolveCorporateCard(req, {
      partnerEnabled: corporateCardResult.available,
      globalEnabled: Boolean(paymentMethod.isCorporateCardPaymentAvailable),
    });
    corporateCard.limits = corporateCardResult.limits ? normalizeLimits(corporateCardResult.limits) : null;
    // A biller that takes no prepaid instrument takes no corporate card either; same rule as the Peko wallet.
    let billerAllowsCard = true;

    if(billerId){
      try {
        const billerDetails = await getABiller({
          credentialId,
          packageId,
          corporateUserId,
          billerId,
          logTraceId: req?.LogTraceId,
        });

        if (!billerDetails || billerDetails === false) {
          customLog(req?.LogTraceId, "error", {
            message: "Unable to fetch biller details for payment modes",
            billerId,
          });
        } else {
          const paymentModeInfo =
            billerDetails?.billerPaymentModes?.paymentModeInfo || [];

          if (Array.isArray(paymentModeInfo) && paymentModeInfo.length > 0) {
            const upperCasedModes = paymentModeInfo.map((m) =>
              String(m.paymentMode || "").toUpperCase()
            );

            const hasWallet = upperCasedModes.includes("WALLET");
            paymentMethod.isWalletPaymentAvailable =
              hasWallet && paymentMethod.isWalletPaymentAvailable;
            billerAllowsCard = hasWallet;

            const gatewayOptionsSet = new Set();

            upperCasedModes.forEach((mode) => {
              switch (mode) {
                case "UPI":
                  gatewayOptionsSet.add("BHIM");
                  gatewayOptionsSet.add("UPI");
                  break;
                case "CREDIT CARD":
                  gatewayOptionsSet.add("Credit Card");
                  break;
                case "DEBIT CARD":
                  gatewayOptionsSet.add("Debit Card");
                  break;
                case "INTERNET BANKING":
                  // Represented as bank account / net banking option
                  gatewayOptionsSet.add("Bank Account");
                  break;
                default:
                  break;
              }
            });

            const hasGatewayOptions = gatewayOptionsSet.size > 0;
            paymentMethod.isGatewayPaymentAvailable =
              hasGatewayOptions && paymentMethod.isGatewayPaymentAvailable;

            paymentMethod.availablePaymentOptions = Array.from(
              gatewayOptionsSet
            );
          }
        }
      } catch (err) {
        customLog(req?.LogTraceId, "error", {
          message: "Error while fetching biller payment modes",
          billerId,
          error: err?.response ?? err,
        });
      }
    }

    const {
      isGatewayPaymentAvailable,
      isWalletPaymentAvailable,
      isCouponApplicable,
      walletLimit = {
        limitPerTransaction: 1000,
        limitPerDay: 10000,
        limitPerMonth: 100000,
      },
      gatewayLimit = {
        limitPerTransaction: 1000,
        limitPerDay: 10000,
        limitPerMonth: 100000,
      },
      availablePaymentOptions = [],
    } = paymentMethod;
    
    return res.status(200).json({
      status: true,
      message: "Payment method fetched successfully",
      responseCode: "000",
      data: {
        isCouponApplicable: isCouponApplicable,
        gateway: {
          available: isGatewayPaymentAvailable,
          provider: isGatewayPaymentAvailable ? pickProviderCode(gatewayProviders, serviceAccessKey) : null,
          limits: gatewayLimit || null,
          usage: paymentSummary.gateway,
          providers: isGatewayPaymentAvailable ? gatewayProviders : [],
        },
        wallet: {
          available: isWalletPaymentAvailable,
          limits: walletLimit || null,
          usage: paymentSummary.wallet,
        },
        corporateCard: {
          available: corporateCard.available && billerAllowsCard,
          reason: corporateCard.available && !billerAllowsCard ? "This biller does not accept card payments." : corporateCard.reason,
          card: corporateCard.card,
          limits: corporateCard.limits,
          usage: paymentSummary.corporateCard,
        },
        availablePaymentOptions: availablePaymentOptions.join("/"),
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error while fetching pg methods", error: error?.response ?? error })
    return next(new ErrorResponse("Unable to process your request at this moment", 400));
  }
});

exports.fetchAllAvailablePgMethodsAdmin = asyncHandler(async (req, res, next) => {
  try {
    let methods = await getPGMethods();

    if (!methods) {
      methods = await createPGMethod();
    }

    const result = await paymentMethodUseCase.getAllPaymentMethods(req.query);

    if (!result.status) {
      return res.status(400).json({
        status: false,
        message: result.message,
        responseCode: "001",
        data: {}
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment method fetched successfully",
      responseCode: "000",
      data: {
        paymentMethods: methods.details,
        data: {
          recordsFiltered: result.recordsFiltered,
          recordsTotal: result.recordsTotal,
          rows: result.data,
        }
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error while fetching pg methods", error })
    return next(new ErrorResponse("Unable to process your request at this moment", 500));
  }
});

exports.updatePgMethodsAdmin = asyncHandler(async (req, res, next) => {
  try {
    const paymentMethods = req.body;
    const methods = await getPGMethods();
    if (!methods) {
      return next(new ErrorResponse("Payment settings are not available right now. Please refresh the page and try again.", 400));
    }
    const updatedMethods = await updatePGMethod(paymentMethods);

    return res.status(200).json({
      status: true,
      message: "Payment method updated successfully",
      responseCode: "000",
      data: { updatedMethods },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error while updating pg methods", error })
    return next(new ErrorResponse("Unable to process your request at this moment", 500));
  }
});

exports.createPaymentMethod = async (req, res) => {
  try {
    const result = await paymentMethodUseCase.createPaymentMethod(req.body);
    if (!result.status) {
      return res.status(400).json({
        status: false,
        message: result.message,
        responseCode: "001",
        data: {}
      });
    }

    return res.status(201).json({
      status: true,
      message: "Payment method created successfully.",
      responseCode: "000",
      data: {
        ...result.data
      }
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Failed to create payment method. Please try again.",
      responseCode: "001",
      data: {}
    });
  }
};

exports.editPaymentMethod = async (req, res) => {
  try {
    const result = await paymentMethodUseCase.editPaymentMethod(req.params.paymentMethodId, req.body);
    if (!result.status) {
      return res.status(400).json({
        status: false,
        message: result.message,
        responseCode: "001",
        data: {}
      });
    }

    return res.status(200).json({
      status: true,
      message: "Payment method updated successfully.",
      responseCode: "000",
      data: {}
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Failed to update payment method. Please try again.",
      responseCode: "001",
      data: {}
    });
  }
};

exports.updatePaymentMethodStatus = asyncHandler(async (req, res) => {
  const result = await paymentMethodUseCase.updatePaymentMethodStatus(req.params.paymentMethodId, req.body.isActive);
  if (!result.status) {
    return res.status(400).json({
      status: false,
      message: result.message,
      responseCode: "001",
      data: {}
    });
  }

  return res.status(200).json({
    status: true,
    message: result.message,
    responseCode: "000",
    data: result.data,
  });
});

exports.getPaymentGateways = asyncHandler(async (req, res) => {
  return res.status(200).json({
    status: true,
    message: "Payment gateways fetched successfully.",
    responseCode: "000",
    data: GATEWAY_PROVIDERS,
  });
});

exports.getAllPaymentMethods = async (req, res) => {
  try {
    const result = await paymentMethodUseCase.getAllPaymentMethods(req.query);

    if (!result.status) {
      return res.status(400).json({
        status: false,
        message: result.message,
        responseCode: "001",
        data: {}
      });
    }
    return res.status(200).json({
      status: true,
      message: "Payment methods fetched successfully.",
      responseCode: "000",
      data: {
        recordsFiltered: result.recordsFiltered,
        recordsTotal: result.recordsTotal,
        data: result.data,
      }
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Failed to fetch payment methods. Please try again.",
      responseCode: "001",
      data: {}
    });
  }
};
