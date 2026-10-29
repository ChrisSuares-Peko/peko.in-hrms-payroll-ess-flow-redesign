import * as Yup from 'yup';

export const productFormSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter a name')
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .test(
            'no-leading-trailing-spaces',
            'Name cannot have leading or trailing spaces',
            value => !value || value === value.trim()
        ),
    description: Yup.string()
        .optional()
        .max(300, 'Description cannot exceed 300 characters')
        .test(
            'min-if-provided',
            'Description must be at least 3 characters',
            value => !value || value.length >= 3
        )
        .test(
            'no-leading-trailing-spaces',
            'Description cannot start or end with a space',
            value => !value || value === value.trim()
        ),
    hsnCode: Yup.string()
        .test('hsn-validation', 'HSN code must be 2, 4, 6, or 8 numeric digits', v => {
            if (!v) return true;
            return /^\d+$/.test(v) && [2, 4, 6, 8].includes(v.length);
        }),
    unitPrice: Yup.number()
        .typeError('Unit price must be a number')
        .required('Please enter unit price')
        .min(1, 'Unit price must be greater than 0')
        .max(99999999.99, 'Unit price must be at most 99,999,999.99'),
    gstRate: Yup.string()
        .oneOf(['0', '5', '12', '18', '28'], 'Please select a valid GST rate')
        .optional(),
});
