import * as Yup from 'yup';

const hasValue = (value?: string) => !!value && value.trim().length > 0;

export const paymentCouponSchema = Yup.object().shape({
    couponCode: Yup.string()
        .max(25, 'Coupon code cannot exceed 25 characters')
        .test(
            'coupon-min-length',
            'Coupon code must be at least 3 characters',
            value => !hasValue(value) || value!.trim().length >= 3
        )
        .test(
            'no-leading-whitespace',
            'Coupon code cannot start with whitespace',
            value => !hasValue(value) || !/^\s/.test(value!)
        )
        .test(
            'no-multiple-whitespace',
            'Coupon code cannot contain consecutive whitespaces',
            value => !hasValue(value) || !/\s{2,}/.test(value!)
        ),
});

export default paymentCouponSchema;
