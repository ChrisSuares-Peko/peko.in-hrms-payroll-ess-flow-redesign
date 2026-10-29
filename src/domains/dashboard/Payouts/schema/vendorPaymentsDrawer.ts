import * as Yup from 'yup';

const spaceValidation = (fieldName: string) => (value: string | undefined) => {
    if (!value) return true;
    if (value.startsWith(' ')) return new Yup.ValidationError(`${fieldName} cannot start with a whitespace`, value, fieldName.toLowerCase());
    if (value.endsWith(' ')) return new Yup.ValidationError(`${fieldName} cannot end with a whitespace`, value, fieldName.toLowerCase());
    if (/ {2,}/.test(value)) return new Yup.ValidationError(`${fieldName} cannot contain consecutive whitespaces`, value, fieldName.toLowerCase());
    return true;
};

export const vendorPaymentsValidationSchema = Yup.object({
    vendorId: Yup.string().required('Please select a vendor'),
    dueDate: Yup.string().required('Please select a due date'),
    totalAmount: Yup.string().required('Please enter amount'),
    description: Yup.string()
        .required('Please enter a description')
        .min(3, 'Description must be at least 3 characters')
        .test('space-validation', 'Invalid description', spaceValidation('Description')),
    notes: Yup.string()
        .test('space-validation', 'Invalid notes', spaceValidation('Notes')),
});
