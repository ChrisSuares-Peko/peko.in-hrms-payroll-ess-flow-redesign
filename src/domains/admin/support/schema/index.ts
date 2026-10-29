import * as Yup from 'yup';

export const ticketSchema = Yup.object().shape({
    issueType: Yup.string().required('Please select issue type'),
    module: Yup.string().required('Please select module '),
    description: Yup.string()
        .required('Please enter description')
        .min(3, 'Description must be at least 3 characters'),
    screenshotImage: Yup.string(),
    corporateUserId: Yup.string().required('Please select user '),
});
