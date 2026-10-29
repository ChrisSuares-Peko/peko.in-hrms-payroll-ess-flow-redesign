import * as Yup from 'yup';

export const downloadPayslipSchema = Yup.object().shape({
    employeeId: Yup.string()
        .transform(value => (value === undefined ? '' : value)) // convert undefined -> ''
        .required('Please select an employee'),
    month: Yup.string().required('Please select a month'),
    year: Yup.string().required('Please select a year'),
    sendEmail: Yup.boolean(), // Optional checkbox, no validation required
});
