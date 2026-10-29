import * as Yup from 'yup';

const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

export const cinSchema = Yup.object().shape({
  cin: Yup.string()
    .trim()
    .uppercase()
    .required('Please enter the CIN')
    .length(21, 'CIN must be 21 characters')
    .matches(cinRegex, 'Invalid CIN format (e.g. U74999MH2024PTC123456)'),
});

export const complianceInfoSchema = Yup.object().shape({
    numberOfEmployees: Yup.string()
        .trim()
        .required('Please enter the number of employees')
        .matches(/^\d+$/, 'Please enter a valid number'),
    registeredOfficeAddress: Yup.string()
        .trim()
        .required('Please enter the registered office address')
        .test(
            'no-leading-or-trailing-whitespace',
            'Registered office address cannot start or end with whitespace',
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            'Registered office address cannot contain consecutive whitespaces',
            value => value === undefined || !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Registered office address cannot be only whitespace',
            value => value === undefined || !/^\s*$/.test(value)
        ),
    authorizedSignatoryName: Yup.string()
        .trim()
        .required('Please enter the authorized signatory name')
        .test(
            'no-leading-or-trailing-whitespace',
            'Authorized signatory name cannot start or end with whitespace',
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            'Authorized signatory name cannot contain consecutive whitespaces',
            value => value === undefined || !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Authorized signatory name cannot be only whitespace',
            value => value === undefined || !/^\s*$/.test(value)
        ),
    signatoryDesignation: Yup.string()
        .trim()
        .required('Please enter the signatory designation')
        .test(
            'no-leading-or-trailing-whitespace',
            'Signatory designation cannot start or end with whitespace',
            value => value === undefined || value.trim() === value
        )
        .test(
            'no-consecutive-whitespace',
            'Signatory designation cannot contain consecutive whitespaces',
            value => value === undefined || !/\s{2,}/.test(value)
        )
        .test(
            'not-only-whitespace',
            'Signatory designation cannot be only whitespace',
            value => value === undefined || !/^\s*$/.test(value)
        ),
});

export const companyDetailsSchema = Yup.object().shape({
    email: Yup.string()
        .trim()
        .required('Please enter the email for compliance alerts')
        .email('Please enter a valid email address')
        .matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email address'
        )
        .max(55, 'Email must be at most 55 characters'),
    mobile: Yup.string()
        .required('Please enter the mobile number')
        .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
    pan: Yup.string()
        .trim()
        .optional()
        .test(
            'pan-format',
            'Please enter a valid PAN number (e.g. ABCDE1234F)',
            value => !value || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)
        ),
    tan: Yup.string()
        .trim()
        .optional()
        .test(
            'tan-format',
            'Please enter a valid TAN number (e.g. ABCD12345E)',
            value => !value || /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(value)
        ),
    gst: Yup.string()
        .trim()
        .optional()
        .test('valid-gstin', 'Please enter a valid GST number', value => {
            if (!value) return true;
            if (value.length !== 15) return false;
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value);
        }),
});
