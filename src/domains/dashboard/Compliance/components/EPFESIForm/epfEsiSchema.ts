import * as Yup from 'yup';

export const epfEsiSchema = Yup.object({
    company_name: Yup.string().required('Company name is required'),

    epf_selectedTypes: Yup.array()
        .of(Yup.string())
        .min(1, 'Please select at least one service type')
        .required('Please select at least one service type'),

    // Registration conditional fields
    reg_totalEmployees: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_REG'),
        then: (s) => s.required('Total employee count is required'),
        otherwise: (s) => s.optional(),
    }),

    reg_natureOfBusiness: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_REG'),
        then: (s) => s.required('Nature of business is required'),
        otherwise: (s) => s.optional(),
    }),

    reg_coverageDate: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_REG'),
        then: (s) => s.required('Coverage date is required'),
        otherwise: (s) => s.optional(),
    }),

    // Return conditional fields
    ret_returnType: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_RETURN'),
        then: (s) => s.required('Return type is required'),
        otherwise: (s) => s.optional(),
    }),

    ret_period: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_RETURN'),
        then: (s) => s.required('Period is required'),
        otherwise: (s) => s.optional(),
    }),

    ret_employeeCount: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_RETURN'),
        then: (s) => s.required('Employee count is required'),
        otherwise: (s) => s.optional(),
    }),

    ret_totalWages: Yup.string().when('epf_selectedTypes', {
        is: (v: string[]) => v?.includes('EPF_ESI_RETURN'),
        then: (s) => s.required('Total wages is required'),
        otherwise: (s) => s.optional(),
    }),

    // Declaration
    decl_agreed: Yup.boolean().oneOf([true], 'You must agree to the declaration'),
});
