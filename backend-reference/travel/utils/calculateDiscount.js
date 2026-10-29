const calculateDiscountResponse = (coupon, amount) => {
    const { discountType, discount, maximumDiscount } = coupon;
    let discountAmount = 0;
    if (discountType === 'FLAT') {
        discountAmount = parseFloat(discount);
    } else if (discountType === 'PERCENTAGE') {
        discountAmount = (parseFloat(amount) * parseFloat(discount)) / 100;
        if (maximumDiscount > 0 && discountAmount > maximumDiscount) {
            discountAmount = maximumDiscount;
        }
    }
    discountAmount = Math.min(discountAmount, amount);
    discountAmount = (Math.floor(discountAmount * 100) / 100).toFixed(2);
    return {
        success: true,
        data: {
            originalAmount: amount,
            discountAmount,
            finalAmount: amount - discountAmount,
        },
    };
};

exports.calculateDiscountResponse = calculateDiscountResponse;
