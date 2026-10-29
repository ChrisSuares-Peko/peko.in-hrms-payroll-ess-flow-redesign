import * as Yup from 'yup';

export const processSalarySchema = Yup.object().shape({
    payingDate: Yup.date()
        .required('Please select the paying date') // Making sure the date is required
        .nullable(), // This allows the value to be null (useful for initial values)
});
