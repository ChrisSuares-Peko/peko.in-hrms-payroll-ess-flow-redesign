import * as Yup from 'yup';

const payrollCategorySchema = Yup.object().shape({
    categoryName: Yup.string()
        .matches(/^[^\s].*$/, 'Category name cannot start with a whitespace')
        .matches(/^[^\s].*$/, 'Category name cannot end with a whitespace')
        .matches(/^(?!.*\s{2,})/, 'Category name cannot contain consecutive whitespaces')
        .min(3, 'Category name must be at least 3 characters')
        .required('Please enter the category name'),

    documentName: Yup.string()
        .matches(/^[^\s].*$/, 'Document name cannot start with a whitespace')
        .matches(/^[^\s].*$/, 'Document name cannot end with a whitespace')
        .matches(/^(?!.*\s{2,})/, 'Document name cannot contain consecutive whitespaces')
        .min(3, 'Document name must be at least 3 characters')
        .required('Please enter the document name'),
});

export default payrollCategorySchema;
