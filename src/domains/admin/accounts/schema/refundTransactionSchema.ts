import * as Yup from 'yup';

export const refundTransactionSchema = (maxAmount: string) =>
    Yup.object().shape({
        refundAmount: Yup.number()
            .typeError('Refund amount must be a number')
            .required('Please enter refund amount')
            .positive('Refund amount must be greater than zero')
            .max(Number(maxAmount), `Refund amount cannot exceed INR ${maxAmount}`),
    });
