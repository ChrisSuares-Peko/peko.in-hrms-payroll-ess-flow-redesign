const asyncHandler = require("../../middlewares/async");
const {
    findAllBanner
} = require('../../models/use-cases/banners');
const { checkUserSubscriptionPriority } = require("../../models/use-cases/subscription");
const ErrorResponse = require("../../utils/error-response");

exports.findAllBanners = asyncHandler(async (req, res, next) => {
    //exclude attributes
    let attributes = ['createdAt', 'updatedAt', 'status', 'deviceType']
    let deviceType = 'WEB'
    let { position } = req.query
    let partnerId = req.user.registeredBy
    const corporateId = req.user.corporateId;
    let result = await findAllBanner(deviceType, position, partnerId, attributes)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching banners`, 500))
    } else {
        let filteredBanners = result;
        const isUserHavingTopPlan = await checkUserSubscriptionPriority(corporateId, partnerId)
        if (position === 'TOP') {
            filteredBanners = result.filter(banner => banner.bannerType !== 'SUBSCRIPTION');
            // if (isUserHavingTopPlan) {
            //     filteredBanners = result.filter(banner => banner.bannerType !== 'SUBSCRIPTION');
            // } else {
            //     filteredBanners = result.filter(banner => banner.bannerType === 'SUBSCRIPTION');
            // }
        }

        return res.status(200).json({
            'status': true,
            'message': 'Banners fetched successfully',
            'data': { result: filteredBanners, isUserHavingTopPlan },
            'responseCode': '000'
        })
    }
})