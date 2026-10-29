import * as Yup from 'yup';

export const mcaSchema = Yup.object({
    // Company details
    company_name: Yup.string().required('Company name is required'),
    company_cin: Yup.string()
        .required('CIN is required')
        .length(21, 'CIN must be exactly 21 characters')
        .matches(
            /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
            'Please enter a valid CIN (e.g. U74999MH2024PTC123456)',
        ),

    // Filing selection
    mca_selectedFilings: Yup.array()
        .of(Yup.string())
        .min(1, 'Please select at least one filing type')
        .required('Please select at least one filing type'),

    // ADT-1 conditional fields
    adt1_auditorName: Yup.string().when('mca_selectedFilings', {
        is: (v: string[]) => v?.includes('ADT1'),
        then: (s) => s.required('Required'),
        otherwise: (s) => s.optional(),
    }),
    adt1_membershipNo: Yup.string().when('mca_selectedFilings', {
        is: (v: string[]) => v?.includes('ADT1'),
        then: (s) => s.required('Required'),
        otherwise: (s) => s.optional(),
    }),

    // Annual filing conditional fields
    annual_financialYear: Yup.string().when('mca_selectedFilings', {
        is: (v: string[]) => v?.includes('AOC4') || v?.includes('MGT7'),
        then: (s) => s.required('Financial year is required'),
        otherwise: (s) => s.optional(),
    }),
    annual_agmDate: Yup.string().when('mca_selectedFilings', {
        is: (v: string[]) => v?.includes('AOC4') || v?.includes('MGT7'),
        then: (s) => s.required('AGM date is required'),
        otherwise: (s) => s.optional(),
    }),

    // Declaration
    decl_agreed: Yup.boolean().oneOf([true], 'You must agree to the declaration'),
});
