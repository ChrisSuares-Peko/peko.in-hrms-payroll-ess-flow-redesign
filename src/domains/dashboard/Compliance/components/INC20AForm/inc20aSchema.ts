import * as Yup from 'yup';

const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const noConsecutiveSpaces = (label: string) => ({
    name: 'no-consecutive-spaces' as const,
    message: `${label} cannot contain consecutive blank spaces`,
    test: (value: string | undefined) => !value || !/\s{2,}/.test(value),
});

const noEdgeWhitespace = (label: string) => ({
    name: 'no-edge-whitespace' as const,
    message: `${label} cannot start or end with whitespace`,
    test: (value: string | undefined) => value == null || (!/^\s/.test(value) && !/\s$/.test(value)),
});

const notOnlyWhitespace = (label: string) => ({
    name: 'not-only-whitespace' as const,
    message: `${label} cannot be only whitespace`,
    test: (value: string | undefined) => value == null || !/^\s*$/.test(value),
});

const textField = (label: string) =>
    Yup.string()
        .test(noEdgeWhitespace(label))
        .test(noConsecutiveSpaces(label))
        .test(notOnlyWhitespace(label));

export const inc20aSchema = Yup.object().shape({
    // Company details
    company_name: textField('Company name').required('Company name is required'),

    company_cin: Yup.string()
        .required('CIN is required')
        .length(21, 'CIN must be exactly 21 characters')
        .matches(CIN_REGEX, 'Invalid CIN format'),

    company_incorporationDate: Yup.string().required('Date of incorporation is required'),

    company_type: Yup.string().required('Type of company is required'),

    company_pan: Yup.string()
        .required('Company PAN is required')
        .matches(PAN_REGEX, 'Invalid PAN format (e.g. ABCDE1234F)'),

    company_tan: Yup.string()
        .test('tan-format', 'Invalid TAN format (e.g. ABCD12345E)', v => !v || TAN_REGEX.test(v)),

    company_gstin: Yup.string()
        .test('gst-format', 'Invalid GSTIN format', v => !v || GST_REGEX.test(v)),

    company_registeredAddress: textField('Registered office address').required('Registered office address is required'),

    company_email: Yup.string()
        .test(noEdgeWhitespace('Official email'))
        .test(notOnlyWhitespace('Official email'))
        .required('Official email is required')
        .matches(EMAIL_REGEX, 'Please enter a valid email'),

    company_mobile: Yup.string()
        .required('Official mobile number is required')
        .matches(MOBILE_REGEX, 'Please enter a valid 10-digit mobile number'),

    company_authorisedCapital: Yup.string().required('Authorised share capital is required'),

    company_paidUpCapital: Yup.string().required('Paid-up / subscribed share capital is required'),

    company_businessActivity: textField('Main business activity').required('Main business activity is required'),

    // Primary contact
    contact_name: textField('Contact person name').required('Contact person name is required'),

    contact_designation: textField('Contact person designation').required('Contact person designation is required'),

    contact_mobile: Yup.string()
        .required('Contact mobile is required')
        .matches(MOBILE_REGEX, 'Please enter a valid 10-digit mobile number'),

    contact_email: Yup.string()
        .test(noEdgeWhitespace('Contact email'))
        .test(notOnlyWhitespace('Contact email'))
        .required('Contact email is required')
        .matches(EMAIL_REGEX, 'Please enter a valid email'),

    // Filing — eligibility
    filing_hasShareCapital: Yup.string().required('Please indicate if the company has share capital'),

    filing_rocVerified: Yup.string().required('Please indicate if the registered office has been verified with the ROC'),

    // Filing — bank account
    filing_accountOpened: Yup.string().required('Please indicate if a current account has been opened'),

    filing_bankName: textField('Bank name').when('filing_accountOpened', {
        is: 'Yes',
        then: schema => schema.required('Bank name is required'),
        otherwise: schema => schema.optional(),
    }),

    filing_branchName: textField('Branch name').when('filing_accountOpened', {
        is: 'Yes',
        then: schema => schema.required('Branch name is required'),
        otherwise: schema => schema.optional(),
    }),

    filing_accountNumber: Yup.string().when('filing_accountOpened', {
        is: 'Yes',
        then: schema => schema.required('Account number is required'),
        otherwise: schema => schema.optional(),
    }),

    filing_totalSubscribedCapital: Yup.string().required('Total subscribed capital as per MOA is required'),

    filing_totalMoneyReceived: Yup.string()
        .required('Total subscription money received is required')
        .test('match-subscribed', 'Must equal total subscribed capital', function matchSubscribed(v) {
            return !v || v === this.parent.filing_totalSubscribedCapital;
        }),

    filing_moneyReceivedDates: textField('Date(s) of money receipt').required('Date(s) of subscription money receipt is required'),

    filing_onlySubscriptionTransactions: Yup.string().required(
        'Please confirm the account has no other transactions',
    ),

    // Declaration
    decl_agreed: Yup.boolean().oneOf([true], 'You must agree to the declaration'),
});
