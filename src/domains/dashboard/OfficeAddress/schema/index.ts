import * as Yup from 'yup';

export const planSchema = Yup.object().shape({
    licenseType: Yup.string().required('Please select the license type'),
    companyName: Yup.string()
        .trim()
        .matches(/^[a-zA-Z0-9 .&]+$/, 'Please enter a valid company name')
        .required('Please enter the company name')
        .min(3, 'Company name must be at least 3 characters')
        .max(50, 'Maximum 50 characters are allowed'),
    expiryDate: Yup.date().required('Please select expiry date'),
    tradeLicenseDoc: Yup.string().required('Please upload the trade license'),
    visaDoc: Yup.string().required('Please upload the visa document'),
});
