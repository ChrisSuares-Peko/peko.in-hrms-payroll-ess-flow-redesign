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
const { customLog } = require('./loggerHelper');
const { findAllActiveSubscriptions } = require('../models/use-cases/subscription')
// const { getGstDetails } = require('../models/use-cases/setting')
const { isInternalAccount } = require('../models/use-cases/setting')

exports.fetchServiceDetails = asyncHandler(async (details) => {
    const {
        credentialId,
        corporateUserId
    } = details
    //fetch operator details
    details.accessKey = (details.accessKey == 'etisalat_direct' && details.serviceType == '1') ? 'etisalat_bill' : details.accessKey
    let service = await findOneServiceOperator(details)
    if (!service) {
        customLog(null, "error", { message: "Service not available", corporateUserId });
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
        customLog(null, "error", { message: "Service is disabled", corporateUserId, serviceOperatorId });
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

    // let gstRate
    // const gstDetails = await getGstDetails()
    // if(gstDetails){
    //     gstRate = gstDetails?.details?.gst
    // }

    return {
        ...service,
        ...cashback,
        // vatRate
    }
})

exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey) => {

    const service = await findOneServiceOperator({ accessKey })
    if (!service) {
        return ({
            error: "Service is disabled"
        })
    } else {
        return service
    }
})
/**
 * Calculates the surcharge amount based on the specified type and inputs.
 * 
 * @param {number|string} surcharge - The surcharge value, which can be a flat amount or a percentage rate.
 * @param {string} surchargeType - The type of surcharge, either 'FLAT' or 'PERCENTAGE'.
 * @param {number|string} totalAmount - The base amount of the order to which the surcharge will be applied.
 * @param {number} [credentialId] - When given, an internal account (Settings > Internal Accounts) is never charged a surcharge.
 * @param {number} [quantity=1] - The quantity of items; defaults to 1 if not specified. Only affects calculations for flat surcharges. Qty is used for bulk payments
 * @returns {Promise<number>} - The calculated surcharge, rounded to two decimal places.
 */
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
