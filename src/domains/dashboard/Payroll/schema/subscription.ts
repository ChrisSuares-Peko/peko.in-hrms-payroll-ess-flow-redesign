import * as Yup from 'yup';

export const addOnSchema = Yup.object().shape({
    addonQuantity: Yup.number()
        .typeError('Please enter a valid number')
        .min(1, 'Please enter a valid number')
        .required('Please enter the number of additional employees'),
});