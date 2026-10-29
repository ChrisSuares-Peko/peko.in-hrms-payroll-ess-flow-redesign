import * as Yup from 'yup';

const categorySchema = Yup.object().shape({
    categoryName: Yup.string()
        .required('Please enter the category name')
        .min(3, 'Category name must be at least 3 characters'),
    vendorId: Yup.string().required('Please select the vendor'),
    categoryImage: Yup.string().required('Please upload the image'),
});

export default categorySchema;
