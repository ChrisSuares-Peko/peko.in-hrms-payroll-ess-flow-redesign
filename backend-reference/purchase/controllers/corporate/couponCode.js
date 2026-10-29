const asyncHandler = require("../../middlewares/async");
const { findOne } = require("../../models/use-cases/couponCode");
const { findAllSubscription } = require("../../models/use-cases/subscription");
const { findOneCouponData } = require("../../models/use-cases/pekoCredits");
const { assignMissingCoupons, findAllUserCoupons, updateExpiredCoupons } = require("../../models/use-cases/userCoupons");
const ErrorResponse = require("../../utils/error-response");
const { Op } = require("sequelize");
const { customLog } = require("../../utils/loggerHelper");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { findOne:findOneCorporateUser } = require("../../models/use-cases/corporateUser");
const { getReferralByCode } = require("../../models/use-cases/referral-code");
const { countOrdersByCouponCode } = require("../../models/use-cases/order");


function calculateDiscountAmount(coupon, amount) {
  let discountAmount;
  const { discountType, discount, maximumDiscount } = coupon
  if (discountType === "FLAT") {
    discountAmount = discount;
  } else if (discountType === "PERCENTAGE") {
    discountAmount = (amount * discount) / 100;
    if (maximumDiscount > 0 && discountAmount > maximumDiscount) {
      discountAmount = maximumDiscount
    }
  }
  // discountAmount = Math.min(discountAmount, amount); // Ensure it does not exceed the original amount
  discountAmount = (Math.floor(discountAmount * 100) / 100).toFixed(2)
  return {
    originalAmount: amount,
    discountAmount: discountAmount,
    finalAmount: amount - discountAmount,
  }
}

exports.applyCoupon = asyncHandler(async (req, res, next) => {
  try {
    const { couponCode, amount, packageId, accessKey, billingType } = req.body;
    const corporateId = req.user.corporateId;
    const partnerId = req.user.registeredBy
    const credentialId = req.user.id //will come from userObject

    const params = {
      couponCode,
      corporateId,
      partnerId,
      accessKey,
      billingType
    }

     customLog(req?.logTraceId, "info", { message: "log for getting coupon params", data: params });

    if (accessKey) {
      const serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId: req.user.packageId,
        corporateUserId: corporateId
      })
     customLog(req?.logTraceId, "info", { message: "log for getting service details id", data: serviceDetails });

      params.serviceOperatorId = serviceDetails.id
    } else {
      params.packageId = packageId
    }

    const isCouponExist = await findOneCouponData(params)


    if (!isCouponExist) {
        // check user referral code
      const user = await findOneCorporateUser({
        corporateId: req.user.id
      });
      let referralFilter = {};
      if (user.referralCode) {
        // CASE 1 -> User with referral code
        const referralId = await getReferralByCode(user.referralCode)
        if (!referralId) {
          return next(new ErrorResponse("Invalid or inactive coupon code", 400));
        }
        referralFilter = { referralCodeId: referralId?.id };
      } else {
        // CASE 2 -> User WITHOUT referral code
        referralFilter = { referralCodeId: null };
      }
      // Find the coupon
     const coupon = await findOne({
        couponCode: couponCode,
        status: true,
        validFrom: {
          [Op.lte]: new Date(),
        },
        validTo: {
          [Op.gte]: new Date(),
        },
        partnerId: partnerId,
        serviceOperatorId: params.serviceOperatorId || null,
        ...referralFilter
      });
       customLog(req?.logTraceId, "info", { message: "log for getting coupon details", data: coupon });
      if (!coupon) {
        return next(new ErrorResponse("Invalid or inactive coupon code", 400));
      }
        // check if coupon is restricted to a specific package
      if (coupon?.packageId && coupon.packageId !== packageId) {
        return next(new ErrorResponse("This coupon code is not valid for the selected plan.", 400));
      }
      
        if (coupon?.billingType === 'MONTHLY' && billingType && coupon?.billingType != billingType.toUpperCase()) {
        return next(new ErrorResponse(`This coupon code can be applied only for monthly subscription plan`, 501));
      }
      if (coupon?.billingType === 'ANNUALLY' && billingType && coupon?.billingType != billingType.toUpperCase()) {
        return next(new ErrorResponse(`This coupon code can be applied only for yearly subscription plan`, 501));
      }
       if (coupon.serviceOperatorId) {
        const usedCount = await countOrdersByCouponCode({ couponCodeId: coupon.id, credentialId });
        if (usedCount >= coupon.usageCount) {
          return next(new ErrorResponse("This coupon code has reached its maximum usage limit.", 400));
        }
      } else {
      const subscriptions = await findAllSubscription({
        corporateUserId: corporateId,
        paymentMode: { [Op.ne]: "ACTIVATION_CODE" },
        subscriptionPaymentRefId: { [Op.ne]: null },
        couponCode: coupon.couponCode,
        isCustom: false,
      });

       if (subscriptions && subscriptions.length >= coupon.usageCount) {
          return next(new ErrorResponse("This coupon code has reached its maximum usage limit.", 400));
        }
      }
      if (amount < coupon.minimumPurchase) {
        return next(new ErrorResponse(`This coupon can only be used on purchases of ₹ ${coupon.minimumPurchase} or more.`, 400));
      }
      const couponPriceData = calculateDiscountAmount(coupon, amount)

      if (coupon.serviceOperatorId && couponPriceData.discountAmount >= amount) {
        return next(new ErrorResponse(`This coupon cannot be applied because the discount is more than the order amount.`, 400));
      }

      return res.status(200).json({
        status: true,
        data: couponPriceData,
        message: "Coupon code applied successfully",
        responseCode: "000",
      });
    }

    if (isCouponExist.couponType === 'SUBSCRIPTION') {
      if (isCouponExist?.billingType === 'MONTHLY' && billingType && isCouponExist?.billingType != billingType.toUpperCase()) {
        return next(new ErrorResponse(`This coupon code can be applied only for monthly subscription plan`, 501));
      }
      if (isCouponExist?.billingType === 'ANNUALLY' && billingType && isCouponExist?.billingType != billingType.toUpperCase()) {
        return next(new ErrorResponse(`This coupon code can be applied only for yearly subscription plan`, 501));
      }
    }

    if (amount < isCouponExist.minimumPurchase) {
      return next(new ErrorResponse(`This coupon can only be used on purchases of ₹${isCouponExist.minimumPurchase} or more.`, 400));
    }

    const couponPriceData = calculateDiscountAmount(isCouponExist, amount)

    if (couponPriceData.discountAmount >= amount) {
      return next(new ErrorResponse(`This coupon cannot be applied because the discount is more than the order amount.`, 400));
    }


    return res.status(200).json({
      status: true,
      data: couponPriceData,
      message: "Coupon code applied successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.logTraceId, "error", { message: "An error occurred", error: error });
    return next(new ErrorResponse(`Something went wrong.`, 500))
  }
});

exports.getAllCouponCodes = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = req.user.corporateId;
    const credientialId = req.user.id;
    const partnerId = req.user.registeredBy
      let isAssigned = { isPekoCreditActive: false, status: true };
      const params = {
        corporateId: credientialId,
      };
      const user = await findOneCorporateUser(params);

      if(!user){
        return res.status(500).json({
        status: false,
        message: "Something went wrong.",
        responseCode: "001",
        data: {},
      })
      }
        // create coupon codes for existing users if it not exist
        isAssigned = await assignMissingCoupons(corporateId, partnerId,user.referralCode);

        if (!isAssigned.status) {
          return next(new ErrorResponse(`Something went wrong.`, 500));
        }
    // update expired coupons
    await updateExpiredCoupons(corporateId)

    const result = await findAllUserCoupons(corporateId, partnerId, req.query)
    if (!result) {
      return res.status(500).json({
        status: false,
        message: "Something went wrong.",
        responseCode: "001",
        data: {},
      })
    }

    const { currentPageCoupons, unclaimedCoupons } = result;

    // Calculate peko credits from unclaimed coupons
    let pekoCredits = 0;
    for (const coupon of unclaimedCoupons) {
      const { discountType, discount, maximumDiscount } = coupon.couponData || {};
      if (discountType === 'FLAT') {
        pekoCredits += parseFloat(discount || 0);
      } else if (discountType === 'PERCENTAGE') {
        pekoCredits += parseFloat(maximumDiscount || 0);
      }
    }

    const couponCodes = currentPageCoupons.rows.map((coupon) => {
      const {
        discount,
        couponType,
        minimumPurchase,
        maximumDiscount,
        package,
        serviceOperator,
        billingType
      } = coupon.couponData;

      let couponCode = coupon.couponData.code
      let discountType = coupon.couponData.discountType
      let discountValue = parseFloat(discount);
      if (coupon.status === 'CLAIMED') {
        // for claimed coupon, fetch the used coupon data ( old data )
        const usedCouponData = coupon.usedCouponData
        discountValue = usedCouponData ? parseFloat(usedCouponData.discount) : 0;
        couponCode = usedCouponData ? usedCouponData.code : coupon.couponData.code
        discountType = usedCouponData ? usedCouponData.discountType : coupon.couponData.discountType
      }
      let serviceName = ''
      if (couponType === 'SUBSCRIPTION') {
        serviceName = (package.aliasName && package.aliasName.trim() !== '')
          ? package.aliasName
          : package.packageName;
      } else {
        serviceName = serviceOperator.serviceProvider
      }
      return {
        serviceName: serviceName,
        isClaimed: coupon.status === 'CLAIMED',
        discountType: discountType,
        discount: discountValue,
        couponCode: couponCode,
        validity: coupon.expiryDate,
        minimumPurchase: minimumPurchase,
        maximumDiscount: maximumDiscount,
        billingType,
        couponType
      };
    });
    return res.status(200).json({
      status: true,
      message: "Coupon codes fetch successfully",
      responseCode: "000",
      data: {
        couponCodes,
        recordsTotal: currentPageCoupons.count,
        pekoCredits: pekoCredits,
        isPekoCreditActive: isAssigned.isPekoCreditActive
      },
    })
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error })
    return next(new ErrorResponse(`Something went wrong.`, 500))
  }
})