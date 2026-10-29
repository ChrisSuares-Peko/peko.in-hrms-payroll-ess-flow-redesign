const {
  findOne: findOneServiceOperator,
} = require("../models/use-cases/serviceOperator");
const {
  findOne: findOneDisableService,
} = require("../models/use-cases/disableService");
const { findOne: findOneCashback } = require("../models/use-cases/cashback");
const asyncHandler = require("../middlewares/async");
const {
  findAllActiveSubscriptions,
  findActiveIndividualBaseForService,
} = require("../models/use-cases/subscription");
const serviceOperators = require("../models/entities/serviceOperator");
const vendors = require("../models/entities/vendor");
const { getGstDetails, isInternalAccount } = require("../models/use-cases/setting");
const { customLog } = require("./loggerHelper");

exports.fetchServiceDetails = asyncHandler(async (details) => {
  const { credentialId, corporateUserId } = details;
  //fetch operator details
  let service = await findOneServiceOperator(details);
  if (!service) {
    console.log("service Not Available");
    return {
      error: "Service not available",
    };
    //return next(new ErrorResponse("Service not available", 200))
  }
  //check disable service
  const serviceOperatorId = service.id;
  const isDisable = await findOneDisableService({
    credentialId,
    serviceOperatorId,
  });
  if (isDisable) {
    console.log("service is disable");
    return {
      error: "Service is disabled",
    };
  }

  const allActiveSubscriptions = await findAllActiveSubscriptions({
    corporateUserId,
  });
  const allActivePackageIds = allActiveSubscriptions.map(
    (subscription) => subscription.packageId
  );

  const individualBase = await findActiveIndividualBaseForService({
    corporateUserId,
    serviceOperatorId,
  });
  const individualCashback = individualBase
    ? await findOneCashback({
        packageIds: [individualBase.packageId],
        serviceOperatorId,
      })
    : null;
  if (individualCashback === undefined) {
    throw new Error("Failed to read cashback row for entitlement resolution");
  }

  //calculate cashback
  const cashback =
    individualCashback ||
    (await findOneCashback({
      packageIds: allActivePackageIds,
      serviceOperatorId,
    }));
  if (!cashback) {
    return {
      error: "Unable to process your request",
    };
  }
  delete cashback.id;
  const data = {
    ...service,
    ...cashback,
  };
  // console.log("✅", data)
  return data 
});

exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey, packageId = null) => {
  const service = await serviceOperators.findOne({
    include: [{ model: vendors, as: "vendor" }],
    where: { accessKey },
    raw: true,
    nest: true,
  });
  if (!service || !packageId) return service;
  const cashback = await findOneCashback({ packageIds: [packageId], serviceOperatorId: service.id });
  if (!cashback) return service;
  return { ...service, ...cashback, id: service.id };
});

// With a credentialId, an internal account (Settings > Internal Accounts) is never charged a surcharge.
exports.calculateSurcharge = async (surcharge = 0, surchargeType, totalAmount, credentialId = null, quantity = 1) => {
  if (credentialId !== null && (await isInternalAccount(credentialId))) return 0;
  const surchargeAmount = parseFloat(surcharge);
  const amount = parseFloat(totalAmount);
  let calculatedSurcharge = 0;
  if (surchargeType === 'FLAT') {
      calculatedSurcharge = surchargeAmount * quantity;
  } else if (surchargeType === 'PERCENTAGE') {
      calculatedSurcharge = (amount * surchargeAmount / 100);
  }
  return parseFloat(calculatedSurcharge.toFixed(2));
}

exports.calculateAmountWithTax = async (amount) => {
  if (amount <= 0) {
    return amount;
  }

  const  data = await getGstDetails();
  if (!data) {
    customLog(null, "error", "Calculate Amount With Tax: Tax rate not found");
    return amount;
  }
  const taxRate = parseFloat(data?.details?.gst || 18);

  const amountNum = parseFloat(amount);
  const taxRateNum = parseFloat(taxRate);

  if (isNaN(amountNum) || isNaN(taxRateNum)) {
    console.error("Invalid amount or tax rate");
    return amount;
  }

  const taxRateDecimal = taxRateNum / 100;

  const amountWithTax = amountNum * (1 + taxRateDecimal);

  return amountWithTax.toFixed(2);
};

exports.calculateSurchargeWithTax = async (surcharge, surchargeType, totalAmount, credentialId = null, quantity = 1) => {
  const surchargeTypeValue = surchargeType || 'FLAT';
  const surchargeWithoutTax = await exports.calculateSurcharge(surcharge, surchargeTypeValue, totalAmount, credentialId, quantity);
  const surchargeWithTax = await exports.calculateAmountWithTax(surchargeWithoutTax);
  return {
    surchargeWithoutTax: parseFloat(surchargeWithoutTax),
    surcharge: parseFloat(surchargeWithTax)
  };
};