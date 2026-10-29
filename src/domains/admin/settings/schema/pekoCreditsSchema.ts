import * as Yup from 'yup';

const pekoCreditsSchema = Yup.object().shape({
    code: Yup.string()
        .required('Please enter the coupon code')
        .matches(/^[A-Za-z0-9]+$/, 'Coupon code must not contain spaces or special characters')
        .min(5, 'Coupon code must be at least 5 characters')
        .max(20, 'Coupon code must not exceed 20 characters'),
    discountType: Yup.string()
        .required('Please select the discount type')
        .oneOf(['PERCENTAGE', 'FLAT'], 'Discount type must be either PERCENTAGE or FLAT'),
    discount: Yup.number()
        .required('Please enter the discount')
        .moreThan(0, 'Please enter a valid discount')
        .when('discountType', (discountType: any, schema) =>
            // eslint-disable-next-line eqeqeq
            discountType == 'PERCENTAGE'
                ? schema
                      //   .integer('Discount must be an integer.')
                      .lessThan(100, 'Discount must be less than 100')
                : schema
        ),
    couponType: Yup.string()
        .required('Please select the coupon type')
        .oneOf(['SERVICES', 'SUBSCRIPTION'], 'Coupon type must be either SERVICES or SUBSCRIPTION'),
    billingType: Yup.string().when('couponType', {
        is: 'SUBSCRIPTION',
        then: schema =>
            schema
                .required('Please select the billing type')
                .oneOf(['MONTHLY', 'ANNUALLY'], 'Billing type must be either MONTHLY or ANNUALLY'),
        otherwise: schema => schema.notRequired(),
    }),

    serviceOperatorId: Yup.string().when('couponType', {
        is: 'SERVICES',
        then: schema => schema.required('Please select the service operator'),
        otherwise: schema => schema.optional().nullable(),
    }),
    packageId: Yup.string().when('couponType', {
        is: 'SUBSCRIPTION',
        then: schema => schema.required('Please select the package'),
        otherwise: schema => schema.optional().nullable(),
    }),
    partnerId: Yup.string().required('Please select a partner'),
    referralCodeId: Yup.string().optional(),
    expiryDays: Yup.number()
        .required('Please enter the expiry days')
        .min(1, 'Expiry days must be at least 1'),
    validUntil: Yup.string().required('Please select the validity.'),
    minimumPurchase: Yup.number().required('Please enter the minimum purchase value'),
    maximumDiscount: Yup.number().when('discountType', {
        is: 'PERCENTAGE',
        then: schema => schema.required('Please enter the maximum discount amount'),
        otherwise: schema => schema.notRequired().nullable(),
    }),
});

export default pekoCreditsSchema;
