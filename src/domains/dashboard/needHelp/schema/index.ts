import * as Yup from 'yup';

export const ticketSchema = Yup.object().shape({
    issueType: Yup.string().required('Please select the issue type'),
    module: Yup.string().required('Please select the module'),
    description: Yup.string()
        .required('Please enter the description')
        .min(3, 'Description must be at least 3 characters')
        .test('no-leading-trailing-spaces', 'Description cannot start or end with whitespace', value => !value || value === value.trim())
        .test('no-consecutive-spaces', 'Description cannot contain consecutive blank spaces', value => !value || !/ {2}/.test(value)),
        screenshotImage: Yup.string(),
});
