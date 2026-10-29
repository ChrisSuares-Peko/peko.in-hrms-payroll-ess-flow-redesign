import * as Yup from 'yup';

export const addTransactionSchema = Yup.object().shape({
    amount: Yup.string()
        .required('Please enter the amount')
        .test('is-valid-amount', 'Enter a valid amount greater than 0', value => {
            const amt = Number(value);
            return !Number.isNaN(amt) && amt > 0;
        }),

    date: Yup.mixed().required('Please select a date'),

    description: Yup.string().trim().required('Please enter a payment description'),
});
