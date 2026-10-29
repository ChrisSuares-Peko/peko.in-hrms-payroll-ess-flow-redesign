import * as Yup from 'yup';


const numbers = /^\d+$/;
const noLeadingOrTrailingSpace = (label: string) =>
    Yup.string().test(
        'no-leading-trailing-space',
        `${label} cannot start or end with a blank space`,
        value => !value || value.trim() === value
    );

const noConsecutiveSpaces = (label: string) =>
    Yup.string().test(
        'no-consecutive-spaces',
        `${label} cannot contain consecutive blank spaces`,
        value => !value || !/\s{2,}/.test(value)
    );

export const subCorporateSchema = Yup.object().shape({
    name: Yup.string()
        .matches(/^[A-Za-z ]+$/, 'Employee name can only contain alphabets and spaces')
        .min(3, 'Employee name must be at least 3 characters')
        .concat(noLeadingOrTrailingSpace('Employee name'))
        .concat(noConsecutiveSpaces('Employee name'))
        .required('Please enter the employee name'),
    email: Yup.string()
        .email('Please enter a valid email ID')
        .required('Please enter the email ID'),
    confirmemail: Yup.string()
        .email('Please enter a valid email ID')
        .oneOf([Yup.ref('email'), undefined], 'Confirm email must match')
        .required('Please confirm the employee email ID'),
    mobileNo: Yup.string()
        .required('Please enter the mobile number')
        .min(10, 'Mobile number must be 10 digits')
        .max(10, 'Mobile number must be 10 digits')
        .matches(numbers, 'Please enter a valid mobile number'),
    // Not free text: the backend resolves this column to a permission preset, and 'Admin' grants
    // corporate-wide card authority. Typing a job title here used to be inert and now would not be.
    role: Yup.string()
        .matches(/^[A-Za-z ]+$/, 'Employee role can only contain alphabets and spaces')
        .concat(noLeadingOrTrailingSpace('Employee role'))
        .concat(noConsecutiveSpaces('Employee role'))
        .required('Please enter the employee role'),
});
