import * as Yup from 'yup';

import { toLimitAmount } from '../utils/paymentMethods';

const limitField = (label: string) =>
    Yup.string().matches(/^\d*$/, `${label} must be a whole number`);

const paymentMethodsSchema = Yup.object().shape({
    partnerId: Yup.string().required('Please select the partner'),
    paymentMethod: Yup.string().required('Please select the payment method'),
    pgProvider: Yup.string().when('paymentMethod', {
        is: 'PAYMENT_GATEWAY',
        then: schema => schema.required('Please select the payment gateway'),
        otherwise: schema => schema.notRequired(),
    }),
    services: Yup.array()
        .of(Yup.string().required('Invalid service'))
        .min(1, 'Please select at least one service')
        .required('Please select at least one service'),
    limitPerTransaction: limitField('Limit per transaction'),
    limitPerDay: limitField('Limit per day').test(
        'not-below-transaction-limit',
        'Limit per day cannot be lower than the limit per transaction',
        function validateDayLimit(value) {
            const perDay = toLimitAmount(value);
            const perTransaction = toLimitAmount(this.parent.limitPerTransaction);
            return !perDay || !perTransaction || perDay >= perTransaction;
        }
    ),
    limitPerMonth: limitField('Limit per month')
        .test(
            'not-below-day-limit',
            'Limit per month cannot be lower than the limit per day',
            function validateMonthAgainstDay(value) {
                const perMonth = toLimitAmount(value);
                const perDay = toLimitAmount(this.parent.limitPerDay);
                return !perMonth || !perDay || perMonth >= perDay;
            }
        )
        .test(
            'not-below-transaction-limit',
            'Limit per month cannot be lower than the limit per transaction',
            function validateMonthAgainstTransaction(value) {
                const perMonth = toLimitAmount(value);
                const perTransaction = toLimitAmount(this.parent.limitPerTransaction);
                return !perMonth || !perTransaction || perMonth >= perTransaction;
            }
        ),
});

export default paymentMethodsSchema;
