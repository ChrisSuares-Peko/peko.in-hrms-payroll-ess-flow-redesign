import * as Yup from 'yup';

const edocsSchema = Yup.object().shape({
    documentBase: Yup.string().required('File is required'),
    categoryId: Yup.string().required('Category is required'),
    documentName: Yup.string().required('Document Name is required'),
    description: Yup.string().required('Description is required'),
});

export default edocsSchema;
