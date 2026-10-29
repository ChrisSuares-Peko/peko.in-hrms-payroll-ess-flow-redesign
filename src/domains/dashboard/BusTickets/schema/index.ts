import * as Yup from 'yup';

const emailRegex = /^(?!\.)[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function whitespaceValidation(validation: Yup.StringSchema, field: string) {
    return validation
        .test('no-leading-space', `${field} cannot start with a whitespace`, value => !value || !value.startsWith(' '))
        .test('no-trailing-space', `${field} cannot end with a whitespace`, value => !value || !value.endsWith(' '))
        .test('no-multiple-whitespace', `${field} cannot contain consecutive whitespaces`, value => !value || !/\s{2,}/.test(value))
        .test('not-only-whitespace', `${field} cannot be only whitespace`, value => !value || !/^\s*$/.test(value));
}

export const travellerSchema = Yup.object().shape({
    firstName: whitespaceValidation(
        Yup.string()
            .min(2, 'First name must be at least 2 characters')
            .required('Please enter the first name'),
        'First name'
    ),
    lastName: whitespaceValidation(
        Yup.string()
            .min(2, 'Last name must be at least 2 characters')
            .required('Please enter the last name'),
        'Last name'
    ),
    dob: Yup.string()
        .required('Please select date of birth')
        .test('min-age', 'Passenger must be at least 3 years old', (value) => {
            if (!value) return true;
            const age = (Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
            return age >= 3;
        }),
    gender: Yup.string().required('Please select gender'),
    countryCode: Yup.string().trim().required('Please select country code'),
    phone: Yup.string()
        .trim()
        .test('valid-phone', '', function validatePhone(value) {
            if (!value) return true;
            if (!/^[6-9]/.test(value)) return this.createError({ message: 'Please enter a valid 10-digit phone number starting with 6, 7, 8 or 9' });
            if (!/^[6-9][0-9]{9}$/.test(value)) return this.createError({ message: 'Please enter a valid 10-digit phone number' });
            return true;
        })
        .required('Please enter the phone number'),
    email: Yup.string()
        .test('no-leading-space', 'Email ID cannot start with a whitespace', v => !v || !v.startsWith(' '))
        .test('no-trailing-space', 'Email ID cannot end with a whitespace', v => !v || !v.endsWith(' '))
        .email('Please enter a valid email ID')
        .matches(emailRegex, 'Please enter a valid email ID')
        .required('Please enter the email ID'),
    idType: Yup.string().required('Please select ID type'),
    idNumber: Yup.string()
        .required('Please enter the ID number')
        .test('no-leading-space', 'ID number cannot start with a whitespace', v => !v || !v.startsWith(' '))
        .test('no-trailing-space', 'ID number cannot end with a whitespace', v => !v || !v.endsWith(' '))
        .test('not-only-whitespace', 'ID number cannot be only whitespace', v => !v || !/^\s*$/.test(v))
        .when('idType', (idTypeVal: any, schema: Yup.StringSchema) => {
            const idType = Array.isArray(idTypeVal) ? idTypeVal[0] : idTypeVal;
            switch (idType) {
                case 'Aadhaar':
                    return schema.matches(/^[2-9][0-9]{11}$/, 'Please enter a valid 12-digit aadhaar number');
                case 'PAN Card':
                    return schema.matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number (e.g. ABCDE1234F)');
                case 'Passport':
                    return schema.matches(/^[A-Z][0-9]{7}$/, 'Please enter a valid passport number (e.g. A1234567)');
                case 'Voter ID':
                    return schema.matches(/^[A-Z]{3}[0-9]{7}$/, 'Please enter a valid voter ID (e.g. ABC1234567)');
                case 'Driving License':
                    return schema.matches(/^[A-Z]{2}[0-9]{13}$/, 'Please enter a valid driving license number (e.g. DL0120110149111)');
                default:
                    return schema.min(3, 'Please enter a valid ID number');
            }
        }),
    address: whitespaceValidation(
        Yup.string().min(3, 'Address must be at least 3 characters'),
        'Address'
    ),
});

export const contactDetailsSchema = Yup.object().shape({
    countryCode: Yup.string().trim().required('Please select country code'),
    phone: Yup.string()
        .trim()
        .test('valid-phone', '', function validatePhone(value) {
            if (!value) return true;
            if (!/^[6-9]/.test(value)) return this.createError({ message: 'Please enter a valid 10-digit phone number starting with 6, 7, 8 or 9' });
            if (!/^[6-9][0-9]{9}$/.test(value)) return this.createError({ message: 'Please enter a valid 10-digit phone number' });
            return true;
        })
        .required('Please enter the phone number'),
    email: Yup.string()
        .test('no-leading-space', 'Email ID cannot start with a whitespace', v => !v || !v.startsWith(' '))
        .test('no-trailing-space', 'Email ID cannot end with a whitespace', v => !v || !v.endsWith(' '))
        .email('Please enter a valid email ID')
        .matches(emailRegex, 'Please enter a valid email ID')
        .required('Please enter the email ID'),
});

export const gstSchema = Yup.object().shape({
    gstName: whitespaceValidation(
        Yup.string().min(3, 'Registration name must be at least 3 characters'),
        'Registration name'
    ),
    gstId: Yup.string()
        .test(
            'valid-gst',
            'Please enter a valid GST number',
            value => !value || /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}/.test(value)
        ),
    gstEmail: Yup.string()
        .test(
            'valid-email',
            'Please enter a valid email ID',
            value => !value || emailRegex.test(value)
        ),
    gstAddress: whitespaceValidation(
        Yup.string().min(3, 'Address must be at least 3 characters'),
        'Address'
    ),
});

export const gstSchemaRequired = Yup.object().shape({
    gstName: whitespaceValidation(
        Yup.string()
            .min(3, 'Registration name must be at least 3 characters')
            .required('Please enter the registration name'),
        'Registration name'
    ),
    gstId: Yup.string()
        .required('Please enter the GST ID')
        .matches(
            /\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}/,
            'Please enter a valid GST number'
        ),
    gstEmail: Yup.string()
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),
    gstAddress: whitespaceValidation(
        Yup.string()
            .min(3, 'Address must be at least 3 characters')
            .required('Please enter the address'),
        'Address'
    ),
});
