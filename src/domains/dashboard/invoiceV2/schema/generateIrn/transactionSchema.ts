import * as Yup from 'yup';

export const transactionSchema = Yup.object({
    supplyType: Yup.string().required('Please select the supply type'),
    documentType: Yup.string().required('Please select the document type'),
    documentPrefix: Yup.string().max(6, 'Max 6 characters'),
    documentNumber: Yup.string()
        .required('Please enter the document number')
        .max(16, 'Max 16 characters'),
    documentDate: Yup.string().required('Please select the document date'),
    reverseCharge: Yup.boolean().required(),
    igstOnIntra: Yup.boolean().required(),
});
