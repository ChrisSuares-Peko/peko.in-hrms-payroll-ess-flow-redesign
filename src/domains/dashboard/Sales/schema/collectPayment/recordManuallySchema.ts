import * as Yup from 'yup';

export const recordManuallySchema = Yup.object().shape({
    amountPaid: Yup.string().trim().required('Amount paid is required'),
    paymentMethod: Yup.string().required('Payment method is required'),
    paymentDate: Yup.string().nullable().required('Payment date is required'),
    referenceId: Yup.string().trim(),
    notes: Yup.string().trim(),
});
