import * as Yup from 'yup';

const companyNameRegex = /^[A-Za-z0-9&.\s-]+$/;

export const subscriptionSchema = Yup.object().shape({
    companyName: Yup.string()
        .required('Please enter the company name')
        .min(3, 'Company name must be at least 3 characters')
        .max(50, 'Company name must be at most 50 characters')
        .matches(companyNameRegex, 'Please enter a valid company name')
        .test(
            'no-leading-whitespace',
            'Company name cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Company name cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Company name cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ), // Not only whitespaces
    adminEmail: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .max(50, 'Email id must be at most 50 characters')
        .required('Please enter the email ID'),
    domainName: Yup.string().max(50, 'Domain name must be at most 50 characters').notRequired(),
});
