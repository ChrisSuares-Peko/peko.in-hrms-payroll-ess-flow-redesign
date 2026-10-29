import { parsePhoneNumberFromString } from 'libphonenumber-js';
import * as Yup from 'yup';

function whitespaceValidation(validation: any, field: string) {
    return validation
        .test(
            'no-leading-whitespace',
            `${field} cannot start with whitespace`,
            (value: string) => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            `${field} cannot contain consecutive whitespaces`,
            (value: string) => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            `${field} cannot be only whitespace`,
            (value: string) => !/^\s/.test(value)
        );
}

export const ReceiverDetailsSchema = Yup.object().shape({
    phoneCode: Yup.string().trim().required('Please select the phone code'),
    phone: Yup.string()
        .trim()
        .min(8, 'Mobile number must be at least 8 digits')
        .max(15)
        .required('Please enter the mobile number')
        .test(
            'is-valid-phone',
            'Mobile number is invalid for this region',
            function validatePhone(value) {
                const { phoneCode } = this.parent; // Access 'phoneCode' from the parent object
                try {
                    const fullNumber = `${phoneCode}${value}`;
                    const parsed = parsePhoneNumberFromString(fullNumber, undefined); // Let the library infer the region
                    return parsed ? parsed.isValid() : false;
                } catch (error) {
                    return false; // If parsing fails, it's invalid
                }
            }
        ),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .matches(
            /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please enter a valid email ID'
        )
        .required('Please enter the email ID'),
});

export const GSTValidation = (IsGSTMandatory: boolean) => {
    const validation = Yup.object().shape({
        GSTCompanyAddress: whitespaceValidation(
            Yup.string()
                .min(3, 'Company address must be at least 3 characters')
                .when([], {
                    is: () => IsGSTMandatory,
                    then: schema => schema.required('Please enter the GST company address'),
                    otherwise: schema => schema.notRequired(),
                }),
            'Company address'
        ),
        GSTCompanyContactNumber: Yup.string()
            .min(10, 'Company contact number must be 10 digits')
            .when([], {
                is: () => IsGSTMandatory,
                then: schema => schema.required('Please enter the GST company contact number'),
                otherwise: schema => schema.notRequired(),
            }),
        GSTCompanyName: whitespaceValidation(
            Yup.string()
                .min(3, 'Company name must be at least 3 characters')
                .when([], {
                    is: () => IsGSTMandatory,
                    then: schema => schema.required('Please enter the GST company name'),
                    otherwise: schema => schema.notRequired(),
                }),
            'Company name'
        ),
        GSTNumber: Yup.string()
            .min(15, 'GST number must be 15 characters')
            .matches(
                /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}/,
                'Pease enter a valid GST number'
            )
            .when([], {
                is: () => IsGSTMandatory,
                then: schema => schema.required('Please enter the GST number'),
                otherwise: schema => schema.notRequired(),
            }),
        GSTCompanyEmail: Yup.string()
            .email('Please enter a valid company email ID')
            .when([], {
                is: () => IsGSTMandatory,
                then: schema => schema.required('Please enter the GST company email ID'),
                otherwise: schema => schema.notRequired(),
            }),
    });

    return validation;
};

export const cancellationSchema = Yup.object().shape({
    reasonForCancellation: Yup.string()
        .required('Please enter the reason for cancellation')
        .min(3, 'Reason must be at least 3 characters')
        .max(10000, 'Maximum 10000 characters are allowed')
        .test(
            'no-leading-whitespace',
            'Reason cannot start with whitespace',
            value => !/^\s/.test(value) // Check if starts with whitespace
        )
        .test(
            'no-multiple-whitespace',
            'Reason cannot contain consecutive whitespaces',
            value => !/\s{2,}/.test(value)
        ) // No consecutive spaces
        .test(
            'not-only-whitespace',
            'Reason cannot be only whitespace',
            value => !/^\s*$/.test(value)
        ),
});
