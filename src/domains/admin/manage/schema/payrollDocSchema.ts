import * as Yup from 'yup';

const payrollDocSchema = Yup.object().shape({
    categoryId: Yup.string().required('Please select the category'),

    documentId: Yup.string().required('Please select the document name'),

    documentBase64: Yup.string().required('Please upload the document'),
});

export default payrollDocSchema;
