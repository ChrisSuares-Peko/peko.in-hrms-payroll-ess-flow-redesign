import * as Yup from 'yup';

import { emailRegex } from '@utils/regex';

export const offerLetterSignerSchema = Yup.object().shape({
    name: Yup.string()
        .required('Please enter recipient name')
        .min(3, 'Name must be at least 3 characters'),
    email: Yup.string()
        .required('Please enter the email ID')
        .matches(emailRegex, 'Please enter a valid email ID'),
    phone: Yup.string().trim(),
});
