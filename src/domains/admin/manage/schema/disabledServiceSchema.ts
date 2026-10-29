import * as Yup from 'yup';

const disabledServiceSchema = Yup.object().shape({
    serviceOperatorId: Yup.string().required('Service operator is required'),
    credentialId: Yup.string().required('Corporate user is required'),
});

export default disabledServiceSchema;
