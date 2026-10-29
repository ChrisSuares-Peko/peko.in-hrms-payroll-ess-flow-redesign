import * as Yup from 'yup';

const attestationCategorySchema = Yup.object().shape({
    issuedCountry: Yup.string().required('Document Issued Country is required'),
    label: Yup.string()
        .matches(/^[^\s].*$/, 'Label cannot start with a space')
        .min(3, 'Label must be at least 3 characters')
        .required('Label is required'),
    value: Yup.string()
        .matches(/^[^\s].*$/, 'Value cannot start with a space')
        .required('Value is required'),
    price: Yup.number()
        .typeError('Price must be a number')
        .positive('Price must be greater than zero')
        .required('Price is required'),
});

export default attestationCategorySchema;
