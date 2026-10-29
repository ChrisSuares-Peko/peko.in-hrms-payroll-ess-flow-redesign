const { findOne } = require("../models/use-cases/couponCode");
const { findAllSubscription } = require("../models/use-cases/subscription");
const { Op } = require("sequelize");

exports.calculateDiscount = async (corporateId, code, amount) => {
  try {
    // Check if the user has already used the coupon
    const subscriptions = await findAllSubscription({
      corporateUserId: corporateId,
    });
    if (subscriptions && subscriptions.length > 1) {
      console.log("🚀 ~ This user (",corporateId,") purchased:", subscriptions.length, "subscriptions", subscriptions);
      return {
        success: false,
        message: "Coupon is not applicable for this user",
      };
    }

    // Find the coupon
    const coupon = await findOne({
      couponCode: code, status: true, validFrom: {
        [Op.lte]: new Date(),
      },
      validTo: {
        [Op.gte]: new Date(),
      },
    });

    if (!coupon) {
      return {
        success: false,
        message: "Invalid or inactive coupon code",
      };
    }

    // Calculate the discount amount
    let discountAmount;
    if (coupon.discountType === "FLAT") {
      discountAmount = coupon.discount;
    } else if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (amount * coupon.discount) / 100;
    }

    // Ensure the discount amount does not exceed the original amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    // Return the result
    return {
      success: true,
      data: {
        originalAmount: amount,
        discountAmount: discountAmount,
        finalAmount: amount - discountAmount,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred while applying the coupon",
    };
  }
};
