import * as Yup from 'yup';

const noConsecutiveWhitespaces = (message: string) =>
    Yup.string().test('no-consecutive-whitespaces', message, value => {
        if (typeof value !== 'string') return true;
        return !/\s{2,}/.test(value);
    });

function isStartsWithSpace(value: any) {
    if (value && typeof value === 'string') {
        return value[0] !== ' ';
    }
    return true;
}

export const addressSchema = Yup.object().shape({
    firstName: Yup.string()
        .trim()
        .required('Please enter first name')
        .min(3, 'First name must be at least 3 characters')
        .max(50, 'First name cannot be longer than 50 characters'),
    lastName: Yup.string()
        .trim()
        .required('Please enter last name')
        .min(3, 'Last name must be at least 3 characters')
        .max(50, 'Last name cannot be longer than 50 characters'),
    phoneNumber: Yup.string()
        .trim()
        .matches(/^[0-9]{10}$/, 'Mobile number must be at least 10 digits')
        .required('Please enter mobile number'),
    email: Yup.string()
        .trim()
        .email('Please enter valid email address')
        .required('Please enter email address')
        .matches(
            /^(?!.*\.@)(?!.*@\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter valid email address'
        ),
    flatNO: Yup.string().trim().required('Please enter flat/house no'),
    city: Yup.string().trim().required('Please enter city'),
    state: Yup.string().trim().required('Please enter state'),
    address: Yup.string()
        .trim()
        .required('Please enter address')
        .min(3, 'Address must be at least 3 characters'),
    postalCode: Yup.string()
        .trim()
        .required('Please enter postal code')
        .matches(/^\d{5,10}$/, 'Please enter postal code'),
});

export const couponSchema = Yup.object().shape({
    couponCode: Yup.string()
        .concat(noConsecutiveWhitespaces('Coupon code must not contain consecutive whitespaces'))
        .required('Please enter coupon/discount code')
        .test('no-multiple-spaces', 'Coupon code cannot start with space', isStartsWithSpace)
        .min(3, 'Coupon code must be at least 3 characters')
        .max(25, 'First name cannot be longer than 50 characters'),
});

export const voucherCodeSchema = Yup.object().shape({
    activationCode: Yup.string()
        .trim()
        .required('Please enter a valid voucher code')
        .matches(/^[A-Z0-9]{16}$/, 'Please enter a valid voucher code'),
});
