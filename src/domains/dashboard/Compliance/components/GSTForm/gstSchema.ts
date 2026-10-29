import * as Yup from 'yup';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const gstSchema = Yup.object().shape({
    company_name: Yup.string().required('Company name is required'),

    gst_selectedTypes: Yup.array()
        .of(Yup.string())
        .min(1, 'Please select at least one service type')
        .required('Please select at least one service type'),

    // GST Registration conditional fields
    reg_expectedTurnover: Yup.string().when('gst_selectedTypes', {
        is: (types: string[]) => Array.isArray(types) && types.includes('GST_REG'),
        then: (schema) => schema.required('Expected annual turnover is required'),
        otherwise: (schema) => schema.optional(),
    }),

    reg_principalAddress: Yup.string().when('gst_selectedTypes', {
        is: (types: string[]) => Array.isArray(types) && types.includes('GST_REG'),
        then: (schema) => schema.required('Principal place of business is required'),
        otherwise: (schema) => schema.optional(),
    }),

    reg_ifscCode: Yup.string().when('gst_selectedTypes', {
        is: (types: string[]) => Array.isArray(types) && types.includes('GST_REG'),
        then: (schema) =>
            schema
                .matches(IFSC_REGEX, 'Invalid IFSC code (e.g. SBIN0001234)')
                .optional(),
        otherwise: (schema) => schema.optional(),
    }),

    // GST Return conditional fields
    ret_gstin: Yup.string().when('gst_selectedTypes', {
        is: (types: string[]) => Array.isArray(types) && types.includes('GST_RETURN'),
        then: (schema) =>
            schema
                .matches(GSTIN_REGEX, 'Enter a valid 15-digit GSTIN')
                .required('GSTIN is required'),
        otherwise: (schema) => schema.optional(),
    }),

    ret_frequency: Yup.string().when('gst_selectedTypes', {
        is: (types: string[]) => Array.isArray(types) && types.includes('GST_RETURN'),
        then: (schema) => schema.required('Filing frequency is required'),
        otherwise: (schema) => schema.optional(),
    }),

    decl_agreed: Yup.boolean()
        .oneOf([true], 'You must agree to the declaration')
        .required('You must agree to the declaration'),
});
