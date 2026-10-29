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
const { findAllActiveSubscriptions } = require('../models/use-cases/subscription')

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

    const allActiveSubscriptions =  await findAllActiveSubscriptions({corporateUserId})
    const allActivePackageIds = allActiveSubscriptions.map((subscription)=> subscription.packageId)

    //calculate cashback
    const cashback = await findOneCashback({
        packageIds:allActivePackageIds,
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

    const service = await findOneServiceOperator({ accessKey })
    if (!service) {
        return ({
            error: "Service is disabled"
        })
    } else {
        return service
    }
})