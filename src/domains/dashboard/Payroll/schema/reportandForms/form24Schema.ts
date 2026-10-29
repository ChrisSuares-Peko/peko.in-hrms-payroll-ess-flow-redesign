import * as Yup from 'yup';

// Validation Schema
export const validationSchema = Yup.object().shape({
    quarter: Yup.string().required('Please select a quarter'),
    file: Yup.mixed().required('Please upload a file'),
});