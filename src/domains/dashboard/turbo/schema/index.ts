import * as Yup from 'yup';

const docSchema = Yup.object().shape({
    documentBase: Yup.string().required('Please upload a document'),
    type: Yup.string().required('Select document type'),

    expiryDate: Yup.string().required('Please select the expiry date'),
});

export default docSchema;
