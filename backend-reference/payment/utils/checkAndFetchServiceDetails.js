const {
    findOne: findOneServiceOperator
} = require('./../models/use-cases/serviceOperator')
const {
    findOne: findOneDisableService
} = require('./../models/use-cases/disableService')
const {
    findOne: findOneCashback
} = require('./../models/use-cases/cashback')
const asyncHandler = require('./../middlewares/async')
const { calculateAmountWithTax } = require('./../services/GSTandTAXcalculation')
const { customLog } = require('./loggerHelper')
const { isInternalAccount } = require('../models/use-cases/setting')

const { findAllActiveSubscriptions } = require('../models/use-cases/subscription')

exports.fetchServiceDetails = asyncHandler(async (details) => {
    const {
        credentialId,
        corporateUserId,
        traceId,
    } = details
    details.accessKey = (details.accessKey == 'etisalat_direct' && details.serviceType == '1') ? 'etisalat_bill' : details.accessKey

    let service = await findOneServiceOperator(details)
    if (!service) {
        customLog(traceId, "error", { message: "fetchServiceDetails: no serviceOperator matches accessKey", accessKey: details.accessKey, corporateUserId, credentialId })
        return ({ error: "Service not available" })
    }

    const allActiveSubscriptions = await findAllActiveSubscriptions({ corporateUserId })
    const allActivePackageIds = allActiveSubscriptions.map((subscription) => subscription.packageId)

    // Resolve cashback against any serviceOperator sharing this accessKey — not just the
    // one findOneServiceOperator happened to return. Multiple rows can share the same
    // accessKey (per-partner copies) and the cashback may have been inserted against a
    // different one. We pick the matching serviceOperator from the cashback row itself.
    let cashback = await findOneCashback({
        packageIds: allActivePackageIds,
        accessKey: details.accessKey,
    })

    // Fall back to the original tight match if the accessKey-based lookup is unsupported
    // by the cashback use-case in older code paths.
    if (!cashback && typeof findOneCashback === "function") {
        cashback = await findOneCashback({
            packageIds: allActivePackageIds,
            serviceOperatorId: service.id,
        })
    }

    if (!cashback) {
        customLog(traceId, "error", {
            message: "fetchServiceDetails: no cashback row for accessKey",
            accessKey: details.accessKey,
            packageIds: allActivePackageIds,
            candidateServiceOperatorId: service.id,
            corporateUserId,
            credentialId,
        })
        return ({ error: "Unable to process your request" })
    }

    const candidateIds = [service.id]
    if (cashback.serviceOperatorId && cashback.serviceOperatorId !== service.id) {
        candidateIds.push(cashback.serviceOperatorId)
    }
    for (const id of candidateIds) {
        const isDisable = await findOneDisableService({ credentialId, serviceOperatorId: id })
        if (isDisable) {
            customLog(traceId, "error", { message: "fetchServiceDetails: serviceOperator disabled for credential", credentialId, serviceOperatorId: id, accessKey: details.accessKey })
            return ({ error: "Service is disabled" })
        }
    }

    // If the cashback pointed at a different serviceOperator than findOneServiceOperator
    // returned, re-fetch by id so the vendor credentials match the cashback row's operator.
    if (cashback.serviceOperatorId && cashback.serviceOperatorId !== service.id) {
        const corrected = await findOneServiceOperator({ id: cashback.serviceOperatorId })
        if (corrected) service = corrected
    }

    delete cashback.id
    return {
        ...service,
        ...cashback,
    }
})

exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey) => {

    const service = await findOneServiceOperator({accessKey})
    if (!service) {
        return ({
            error: "Service is disabled"
        })
    } else {
        return service
    }
})

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
  
  exports.calculateSurchargeWithTax = async (surcharge, surchargeType, totalAmount, credentialId = null, quantity = 1) => {
    const surchargeTypeValue = surchargeType || 'FLAT';
    const surchargeWithoutTax = await exports.calculateSurcharge(surcharge, surchargeTypeValue, totalAmount, credentialId, quantity);
    const surchargeWithTax = await calculateAmountWithTax(surchargeWithoutTax);

    return {
      surchargeWithoutTax: parseFloat(surchargeWithoutTax),
      surcharge: parseFloat(surchargeWithTax)
    };
  };