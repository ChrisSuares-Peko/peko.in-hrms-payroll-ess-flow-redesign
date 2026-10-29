export interface IPlan {
    skuCode: string;
    webUrl: string;
    productName: string;
    planName: string;
    pricingDetails: {
        billingCycle: string;
        amount: string;
        currency: string;
        discountPercentage: string;
        discountedAmount: string;
        discountedAmountInConvertedCurrency: string;
    };
}
