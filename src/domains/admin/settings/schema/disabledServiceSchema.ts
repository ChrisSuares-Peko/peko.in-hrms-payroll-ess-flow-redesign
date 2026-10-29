import * as Yup from 'yup';

const disabledServiceSchema = Yup.object().shape({
    serviceOperatorIds: Yup.array()
        .of(Yup.string().required())
        .min(1, 'Please select at least one service operator')
        .required('Please select the service operator'),

    credentialId: Yup.string().required('Please select the corporate user'),
});

export default disabledServiceSchema;
