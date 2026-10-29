import type { Dayjs } from 'dayjs';
import * as Yup from 'yup';

export const createPaymentLinkSchema = Yup.object({
    amount: Yup.number().min(5,"Amount must be greater than or equal to 5").max(100000,"Amount must be less than 100000")
        .required('Please enter the amount'),
    customerPhone: Yup.string()
        .trim()
        .required('Please enter customer phone')
        .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number starting with 6-9'),
    customerName: Yup.string()
        .max(80, 'Customer name must be at most 80 characters')
        .test(
            'no-leading-or-trailing-whitespace',
            'Customer name cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .test(
            'no-consecutive-whitespace',
            'Customer name cannot contain consecutive whitespaces',
            value => !value || !/\s{2,}/.test(value)
        ),
    customerEmail: Yup.string()
        .trim()
        .email('Enter a valid email address'),
    purposeMessage: Yup.string()
        .trim()
        .max(50, 'Payment purpose must be at most 50 characters')
        .test(
            'min-length-if-present',
            'Payment purpose must be at least 6 characters',
            value => !value || value.trim().length >= 6
        ),
});

export const enachValidationSchema = Yup.object({
    customerName: Yup.string()
        .test(
            'no-leading-or-trailing-whitespace',
            'Customer name cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .test(
            'no-consecutive-whitespace',
            'Customer name cannot contain consecutive whitespaces',
            value => !value || !/\s{2,}/.test(value)
        )
        .min(3, 'Customer name must be at least 3 characters')
       .required('Please enter Customer Name'),
    email: Yup.string()
        .test(
            'email-not-empty-after-trim',
            'Please enter Email Address',
            value => !!value && value.trim().length > 0
        )
        .test(
            'email-no-leading-or-trailing-whitespace',
            'Email Address cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .email('Please enter a valid email ID')
        .required('Please enter Email Address'),
    mobile: Yup.string()
        .test(
            'mobile-not-empty-after-trim',
            'Please enter Mobile Number',
            value => !!value && value.trim().length > 0
        )
        .test(
            'mobile-no-leading-or-trailing-whitespace',
            'Mobile Number cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .matches(/^[6-9]\d{9}$/, {
            message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9',
            excludeEmptyString: true,
        })
        .required('Please enter Mobile Number'),
    accountNumber: Yup.string()
        .test(
            'account-number-not-empty-after-trim',
            'Please enter Account Number',
            value => !!value && value.trim().length > 0
        )
        .test(
            'account-number-no-leading-or-trailing-whitespace',
            'Account Number cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .matches(/^\d+$/, {
            message: 'Account number must contain digits only',
            excludeEmptyString: true,
        })
        .min(9, 'Account number must be between 9 to 18 digits')
        .max(18, 'Account number must be between 9 to 18 digits')
        .required('Please enter Account Number'),
    accountType: Yup.string()
        .oneOf(['SAVINGS', 'CURRENT'], 'Select a valid account type')
        .required('Please select Account Type'),
    bankCode: Yup.string()
        .test(
            'bank-code-not-empty-after-trim',
            'Please enter Bank Code',
            value => !!value && value.trim().length > 0
        )
        .test(
            'bank-code-no-leading-or-trailing-whitespace',
            'Bank Code cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .required('Please enter Bank Code'),
    authenticationMode: Yup.string().required('Please select Authentication Mode'),
    amountRule: Yup.string()
        .oneOf(['fixed', 'max'], 'Select a valid amount rule')
        .required('Please select Amount Rule'),
    categoryCode: Yup.string()
        .oneOf(['API', 'B2B', 'CRED', 'MAND', 'EDU', 'PREM', 'PAYM', 'LONS', 'LONP', 'MF', 'OTH', 'SUB', 'TRE', 'TAX', 'ELEC', 'GAS', 'TELE', 'WAT'], 'Select a valid category')
        .required('Please select Category'),
    amount: Yup.string()
        .test(
            'amount-not-empty-after-trim',
            'Please enter Amount',
            value => !!value && value.trim().length > 0
        )
        .test(
            'amount-no-leading-or-trailing-whitespace',
            'Amount cannot start or end with whitespace',
            value => !value || value === value.trim()
        )
        .test('positive-amount', 'Amount must be greater than 0', value => Number(value || 0) > 0)
        .test(
            'max-amount',
            'Amount must be less than or equal to 10000000',
            value => Number(value || 0) <= 10000000
        )
        .required('Please enter Amount'),
    frequency: Yup.string()
        .oneOf(['Adhoc', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Yearly', 'Bi-Monthly'])
        .required('Please select Frequency'),
    startDate: Yup.mixed<Dayjs>()
        .required('Please select Mandate Start Date'),
    endDate: Yup.mixed<Dayjs>().required('Please select Mandate End Date'),
});



export const generateQrCodeSchema = Yup.object({
    amount: Yup.number()
        .typeError('Enter a valid amount')
        .min(5,"Amount must be greater than or equal to 5")
        .max(100000,"Amount must be less than 100000")
        .required('Please enter the amount'),
    purpose_message: Yup.string()
        .trim()
        .min(6, 'Payment Purpose must be at least 6 characters')
        .max(50, 'Payment Purpose must be at most 50 characters')
        .required('Please enter payment purpose'),
    expiry_time: Yup.number().required('Please select the expiry'),
});

export const upiCollectValidationSchema = Yup.object({
    amount: Yup.number()
        .typeError('Amount must be a number')
        .positive('Amount must be greater than 0')
        .required('Amount is required'),
    upiId: Yup.string()
        .matches(
            /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/,
            'Enter a valid UPI ID (e.g. name@upi, 9876543210@ybl)'
        )
        .required('Customer UPI ID is required'),
    customerName: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Customer name is required'),
    email: Yup.string()
        .email('Enter a valid email address')
        .required('Email is required'),
    phone: Yup.string()
        .matches(/^\d{10}$/, 'Enter a valid 10-digit mobile number')
        .required('Phone number is required'),
    expiry: Yup.number()
        .required('Request expiry is required'),
});
