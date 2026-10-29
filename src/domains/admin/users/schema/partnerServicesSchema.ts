import * as Yup from 'yup';

export const assignPartnerServicesSchema = Yup.object().shape({
    partnerId: Yup.number()
        .typeError('Please select a partner')
        .required('Please select a partner'),
});

export default assignPartnerServicesSchema;
