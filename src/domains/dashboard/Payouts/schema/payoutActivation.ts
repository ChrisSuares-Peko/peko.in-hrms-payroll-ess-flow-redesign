import * as Yup from 'yup';

const noWhitespace = (fieldName: string) =>
    Yup.string()
        .test('no-leading-whitespace', `${fieldName} cannot start with a whitespace`, v => !v || !/^\s/.test(v))
        .test('no-trailing-whitespace', `${fieldName} cannot end with a whitespace`, v => !v || !/\s$/.test(v))
        .test('no-consecutive-whitespace', `${fieldName} cannot contain consecutive whitespaces`, v => !v || !/\s{2}/.test(v));

export const step1ValidationSchema = Yup.object({
    merchantName: noWhitespace('Merchant name')
        .concat(Yup.string().required('Please enter the merchant name').min(3, 'Merchant name must be at least 3 characters')),
    contactNumber: Yup.string()
        .required('Please enter the contact number')
        .matches(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit mobile number starting with 6–9'),
    email: Yup.string()
        .required('Please enter the official email')
        .matches(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/, 'Please enter a valid email address'),
    websiteUrl: Yup.string()
        .required('Please enter the website URL')
        .url('Please enter a valid URL (e.g. https://example.com)'),
});

export const step2ValidationSchema = Yup.object({
    city: noWhitespace('City')
        .concat(Yup.string().required('Please enter the city').min(2, 'City must be at least 2 characters')),
    state: noWhitespace('State')
        .concat(Yup.string().required('Please enter the state').min(2, 'State must be at least 2 characters')),
    pincode: Yup.string()
        .required('Please enter the pincode')
        .matches(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit pincode'),
});

export const step3ValidationSchema = Yup.object({
    accountNumber: Yup.string()
        .required('Please enter the account number')
        .matches(/^\d{9,18}$/, 'Enter a valid account number (9–18 digits)'),
    ifscCode: Yup.string()
        .required('Please enter the IFSC code')
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g. SBIN0001234)'),
    bankName: noWhitespace('Bank name').concat(Yup.string().min(3, 'Bank name must be at least 3 characters')),
});

export const step4ValidationSchema = Yup.object({
    cancelledCheque: Yup.mixed<File>()
        .required('Please upload the cancelled cheque')
        .test('file-type', 'Only PDF or image files are allowed', value =>
            !value || ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes((value as File).type)
        ),
});

