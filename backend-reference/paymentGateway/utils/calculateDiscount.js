const { Op } = require('sequelize');

const { findOne } = require("../models/use-cases/couponCode");
const { findOneCouponData, updateOneCouponData } = require("../models/use-cases/pekoCredits");
const { findAllSubscription } = require("../models/use-cases/subscription");
const { customLog } = require('./loggerHelper');
const { findOneCorporateUser } = require("../models/use-cases/corporateUser");
const { getReferralByCode } = require("../models/use-cases/referral_codes");

// Helper function to calculate and format the discount response
const calculateDiscountResponse = (coupon, amount) => {

  const { discountType, discount, maximumDiscount } = coupon
  let discountAmount = 0;
  if (discountType === "FLAT") {
    discountAmount = parseFloat(discount);
  } else if (discountType === "PERCENTAGE") {
    discountAmount = (parseFloat(amount) * parseFloat(discount)) / 100;
    if (maximumDiscount > 0 && discountAmount > maximumDiscount) {
      discountAmount = maximumDiscount
    }
  }
  discountAmount = Math.min(discountAmount, amount); // Ensure it does not exceed the original amount
  // discountAmount = (Math.floor(discountAmount * 100) / 100).toFixed(2)

  discountAmount = Math.floor(discountAmount * 100) / 100
  const finalAmount = Math.round((amount - discountAmount) * 100) / 100;

  return {
    success: true,
    data: {
      originalAmount: amount,
      discountAmount,
      finalAmount: finalAmount,
      couponTotalDiscount: discountAmount,
    },
  };
};

const calculateDiscount = async (corporateId, code, amount, packageId, transaction, billingType, claimCoupon = false, partnerId = null) => {
  try {
    // Check if the coupon exists as a Peko credit coupon
    const {data:isCouponExist} = await findOneCouponData({couponCode:code, corporateUserId:corporateId, packageId});

    if(!isCouponExist) {
     
      const { data: user } = await findOneCorporateUser({
        id: corporateId
      });
      let referralFilter = {};
      if (user && user.referralCode) {
        // CASE 1 -> User with referral code
        const referralId = await getReferralByCode(user.referralCode)
        if (!referralId) {
          return {
            success: false,
            message: "Invalid or inactive coupon code",
          };
        }
        referralFilter = { referralCodeId: referralId?.id };
      } else {
        // CASE 2 -> User WITHOUT referral code
        referralFilter = { referralCodeId: null };
      }

      const coupon = await findOne({
        couponCode: code, status: true, validFrom: {
          [Op.lte]: new Date(),
        },
        validTo: {
          [Op.gte]: new Date(),
        },
        partnerId: partnerId,
        serviceOperatorId: null,
        ...referralFilter
      });
      if (!coupon) {
        return {
          success: false,
          message: "Invalid or inactive coupon code",
        };
      }
 if (coupon?.billingType === 'MONTHLY' && billingType && coupon?.billingType != billingType.toUpperCase()) {
        return {
          success: false,
          message: "This coupon code can be applied only for monthly subscription plan",
        };
      }
      if (coupon?.billingType === 'ANNUALLY' && billingType && coupon?.billingType != billingType.toUpperCase()) {
        return {
          success: false,
          message: "This coupon code can be applied only for yearly subscription plan",
        };
      }

      const subscriptions = await findAllSubscription({
        corporateUserId: corporateId,
        subscriptionPaymentRefId: { [Op.ne]: null },
        couponCode: coupon.couponCode,
        isCustom: false,
      });

      if (subscriptions && subscriptions.length >= coupon.usageCount) {
        return {
          success: false,
          message: "This coupon code has reached its maximum usage limit.",
        };
      }
      // Use the found coupon for discount calculation
      return calculateDiscountResponse(coupon, amount);
    }

    if (isCouponExist.couponType === 'SUBSCRIPTION') {
      if (isCouponExist?.billingType != billingType.toUpperCase()) {
        return {
          success: false,
          message: "Invalid coupon code provided",
        };
      }
    }
    const data = calculateDiscountResponse(isCouponExist, amount)
    
    // Only claim coupon if explicitly requested (after all validations pass)
    if (claimCoupon) {
      const updateResult = await updateOneCouponData({couponData:isCouponExist, corporateId, transaction, discountAmount:data.discountAmount})
      if (!updateResult || !updateResult.success) {
        customLog(null, "error", { message: "Failed to claim coupon", updateResult })
        return {
          success: false,
          message: "Failed to claim coupon",
        };
      }
    }

    // Calculate discount for existing Peko credit coupon
    return data;

  } catch (error) {
    customLog(null, "error", { message: "Error while calculating coupon discount", error })
    return {
      success: false,
      message: "An error occurred while applying the coupon",
    };
  }
};

module.exports = { calculateDiscountResponse, calculateDiscount };