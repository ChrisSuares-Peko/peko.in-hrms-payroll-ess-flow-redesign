import * as Yup from 'yup';

import { emailRegex, indianMobileRegex } from '@utils/regex';

// Matches employeeProfile.ts's noExtraSpacesValidation exactly, so whitespace
// errors read the same way as the regular Add Employee flow.
const noExtraSpacesValidation = (fieldName: string) =>
    Yup.string()
        .test(
            'no-leading-space',
            `${fieldName} cannot start with a whitespace`,
            value => !value || !/^\s/.test(value)
        )
        .test(
            'no-trailing-space',
            `${fieldName} cannot end with a whitespace`,
            value => !value || !/\s$/.test(value)
        )
        .test(
            'no-consecutive-spaces',
            `${fieldName} cannot contain consecutive whitespaces`,
            value => !value || !/\s{2,}/.test(value)
        );

export const newHireBasicDetailsSchema = Yup.object({
    firstName: noExtraSpacesValidation('First name')
        .required('Please enter the first name of the employee')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be at most 50 characters'),
    lastName: noExtraSpacesValidation('Last name')
        .required('Please enter the last name of the employee')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be at most 50 characters'),
    gender: Yup.string().required('Please select gender of the employee'),
    dateOfBirth: Yup.string().required('Please select date of birth of the employee'),
    country: Yup.string().required('Please enter country of the employee'),
    mobileNo: Yup.string()
        .required('Please enter mobile number of the employee')
        .matches(indianMobileRegex, 'Please enter a valid 10-digit mobile number')
        .test(
            'not-all-zero',
            'Mobile number cannot be all zeros',
            value => !/^(0)+$/.test(value || '')
        ),
    email: Yup.string()
        .required('Please enter email ID of the employee')
        .email('Please enter a valid email ID of the employee')
        .test(
            'no-leading-special-characters',
            'Email addresses cannot start with a special character',
            value => !value || /^[a-zA-Z0-9]/.test(value)
        )
        .test('valid-domain', 'Please enter a valid email ID of the employee', value => {
            if (!value) return true;
            return emailRegex.test(value);
        }),
    department: Yup.string().optional(),
    designation: noExtraSpacesValidation('Designation')
        .required('Please enter designation of the employee')
        .min(3, 'Designation must be at least 3 characters')
        .max(50, 'Designation must be at most 50 characters'),
    dateOfJoin: Yup.string().required('Please enter date of joining of the employee'),
});

// Step 1 (Salary) validates against the CTC calculator's own state (see AddNewHire.tsx's
// handleNext), not a Formik schema — salary is tracked entirely outside Formik.
export const getNewHireValidationSchema = (step: number) => {
    if (step === 0) return newHireBasicDetailsSchema;
    return Yup.object({});
};
