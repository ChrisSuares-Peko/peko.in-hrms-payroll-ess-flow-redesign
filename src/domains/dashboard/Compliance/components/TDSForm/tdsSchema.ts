import * as Yup from 'yup';

export const tdsSchema = Yup.object({
    company_name: Yup.string().required('Company name is required'),

    tds_selectedTypes: Yup.array()
        .of(Yup.string())
        .min(1, 'Please select at least one service type')
        .required('Please select at least one service type'),

    // TAN Registration conditional fields
    tan_deductionReason: Yup.string().when('tds_selectedTypes', {
        is: (v: string[]) => v?.includes('TAN_REG'),
        then: (s) => s.required('Deduction reason is required'),
        otherwise: (s) => s.optional(),
    }),
    tan_address: Yup.string().when('tds_selectedTypes', {
        is: (v: string[]) => v?.includes('TAN_REG'),
        then: (s) => s.required('Address for TAN is required'),
        otherwise: (s) => s.optional(),
    }),
    tan_personName: Yup.string().when('tds_selectedTypes', {
        is: (v: string[]) => v?.includes('TAN_REG'),
        then: (s) => s.required('Person name is required'),
        otherwise: (s) => s.optional(),
    }),

    // TDS Return conditional fields
    ret_tan: Yup.string().when('tds_selectedTypes', {
        is: (v: string[]) => v?.includes('TDS_RETURN'),
        then: (s) =>
            s
                .required('TAN is required')
                .matches(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/, 'Invalid TAN format (e.g. ABCD12345E)'),
        otherwise: (s) => s.optional(),
    }),
    ret_quarter: Yup.string().when('tds_selectedTypes', {
        is: (v: string[]) => v?.includes('TDS_RETURN'),
        then: (s) => s.required('Quarter is required'),
        otherwise: (s) => s.optional(),
    }),

    // Declaration
    decl_agreed: Yup.boolean().oneOf([true], 'You must agree to the declaration'),
});
