import * as Yup from 'yup';

const baseCouponFields = {
    couponCode: Yup.string()
        .required('Please enter the coupon code')
        .matches(/^[A-Za-z0-9]+$/, 'Coupon code must not contain spaces or special characters')
        .min(5, 'Coupon code must be at least 5 characters')
        .max(20, 'Coupon code must not exceed 20 characters'),
    discountType: Yup.string()
        .required('Please select the discount type')
        .oneOf(['PERCENTAGE', 'FLAT'], 'Discount type must be either PERCENTAGE or FLAT'),
     discount: Yup.number()
        .required('Please enter the discount')
        .min(0.01, 'Please enter a valid discount')
        .when('discountType', (discountType: any, schema) =>
            // eslint-disable-next-line eqeqeq
            discountType == 'PERCENTAGE'
                ? schema.lessThan(100, 'Discount must be less than 100')
                : schema
        ),
     minimumPurchase: Yup.number()
        .typeError('Please enter a valid minimum purchase value')
        .required('Please enter the minimum purchase value')
        .min(0, 'Minimum purchase value must be at least 0'),
    maximumDiscount: Yup.number()
        .typeError('Please enter a valid maximum discount amount')
        .when('discountType', {
            is: 'PERCENTAGE',
            then: schema =>
                schema
                    .required('Please enter the maximum discount amount')
                    .min(0.01, 'Maximum discount amount must be greater than 0'),
            otherwise: schema => schema.optional().nullable(),
        }),
    couponType: Yup.string()
        .required('Please select the coupon type')
        .oneOf(['SERVICES', 'SUBSCRIPTION'], 'Coupon type must be either SERVICES or SUBSCRIPTION'),
    validFrom: Yup.string().required('Please select the start date'),
    validTo: Yup.string().required('Please select the end date'),
    usageCount: Yup.number()
        .typeError('Please enter a valid usage count')
        .required('Please enter the usage count')
        .min(1, 'Usage count must be at least 1'),
   billingType: Yup.string().when('couponType', {
        is: 'SUBSCRIPTION',
        then: schema =>
            schema
                .required('Please select the billing type')
                .oneOf(['MONTHLY', 'ANNUALLY'], 'Billing type must be either MONTHLY or ANNUALLY'),
        otherwise: schema => schema.notRequired(),
    }),
    packageId: Yup.string().when('couponType', {
        is: 'SUBSCRIPTION',
        then: schema => schema.required('Please select a package'),
        otherwise: schema => schema.optional().nullable(),
    }),
};

export const createCouponCodeSchema = Yup.object().shape({
    ...baseCouponFields,
    serviceOperatorIds: Yup.array()
        .of(Yup.string())
        .when('couponType', {
            is: 'SERVICES',
            then: schema =>
                schema
                    .min(1, 'Please select at least one service operator')
                    .required('Please select at least one service operator'),
            otherwise: schema => schema.optional().nullable(),
        }),
});

export const updateCouponCodeSchema = Yup.object().shape({
    ...baseCouponFields,
    serviceOperatorId: Yup.string().when('couponType', {
        is: 'SERVICES',
        then: schema => schema.required('Please select the service operator'),
        otherwise: schema => schema.optional().nullable(),
    }),
});
