import * as Yup from 'yup';

const numbers = /^\d+$/;
export const requestDetailsSchema = Yup.object().shape({
    storeName: Yup.string()
        .trim()
        .required('Please enter store name')
        .min(3, 'Minimum 3 characters are required')
        .max(50, 'Maximum 50 characters are allowed'),
    businessCategory: Yup.string().optional(),
    contactPerson: Yup.string().required('Please enter contact person name'),
    mobileNumber: Yup.string()
        .required('Please enter mobile number')
        .trim()
        .min(9, 'Phone number must be 10 digits')
        .max(10, 'Maximum 10 characters are allowed')
        .matches(numbers, 'Please enter a valid mobile number'),
    email: Yup.string().email('Please enter valid email').required('Please enter email'),
    city: Yup.string().optional(),
    preferredLanguage: Yup.string()
        .min(3, 'Minimum 3 characters are required')
        .max(50, 'Maximum 50 characters are allowed'),
});
