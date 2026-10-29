import * as Yup from 'yup';

export const initiateKybSchema = Yup.object().shape({
    businessType: Yup.string().trim().required('Please select a business type'),
});
