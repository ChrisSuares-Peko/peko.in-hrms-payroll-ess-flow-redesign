const {
  findOne: findOneServiceOperator,
} = require("./../models/use-cases/serviceOperator");
const {
  findOne: findOneDisableService,
} = require("./../models/use-cases/disableService");
const { findOne: findOneCashback } = require("./../models/use-cases/cashback");
const asyncHandler = require("./../middlewares/async");
const {
  findAllActiveSubscriptions,
} = require("../models/use-cases/subscription");
const { customLog } = require("./loggerHelper");
const { getGstDetails, isInternalAccount } = require("../models/use-cases/setting");

exports.fetchServiceDetails = asyncHandler(async (details) => {
  const {
      credentialId,
      corporateUserId
  } = details
  //fetch operator details
  details.accessKey = (details.accessKey == 'etisalat_direct' && details.serviceType == '1') ? 'etisalat_bill' : details.accessKey
  let service = await findOneServiceOperator(details)
  if (!service) {
      console.log("service Not Available")
      return ({
          error: "Service not available"
      })
      //return next(new ErrorResponse("Service not available", 200))
  }
  //check disable service
  const serviceOperatorId = service.id
  const isDisable = await findOneDisableService({
      credentialId,
      serviceOperatorId
  })
  if (isDisable) {
      console.log("service is disable")
      return ({
          error: "Service is disabled"
      })
  }

  const allActiveSubscriptions = await findAllActiveSubscriptions({ corporateUserId })
  const allActivePackageIds = allActiveSubscriptions.map((subscription) => subscription.packageId)

  //calculate cashback
  const cashback = await findOneCashback({
      packageIds: allActivePackageIds,
      serviceOperatorId
  })
  if (!cashback) {
      return ({
          error: "Unable to process your request"
      })
  }
  delete cashback.id
  return {
      ...service,
      ...cashback
  }
})
exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey) => {
  const service = await findOneServiceOperator({ accessKey });
  if (!service) {
    return {
      error: "Service is disabled",
    };
  } else {
    return service;
  }
});

// With a credentialId, an internal account (Settings > Internal Accounts) is never charged a surcharge.
exports.calculateSurcharge = async (surcharge, surchargeType, totalAmount, credentialId = null, quantity = 1) => {
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

  if (isNaN(amountNum) || isNaN(taxRateNum) || taxRate <= 0) {
    console.error("Invalid amount or tax rate or tax rate is lessthan zero");
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
    surcharge: parseFloat(surchargeWithTax),
  };
};