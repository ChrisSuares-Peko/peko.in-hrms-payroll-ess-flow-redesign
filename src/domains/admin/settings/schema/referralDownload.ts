import * as Yup from 'yup';

const referalDownload = Yup.object().shape({
    fromDate: Yup.date()
        .nullable()
        .test('date-check', 'From Date must be selected', (value, context) => {
            const { toDate } = context.parent;
            if (!value && toDate) {
                return false; // Both dates are empty
            }
            return true; // At least one date is selected
        }),
    toDate: Yup.date()
        .nullable()
        .test('date-check', 'To Date must be selected', (value, context) => {
            const { fromDate } = context.parent;
            if (!value && fromDate) {
                return false; // Both dates are empty
            }
            return true; // At least one date is selected
        }),
});

export default referalDownload;
