import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../../utils/yupHelpers';

export const recipientSchema = Yup.object().shape({
    name: withLetterRequired(
        withSpaceValidation(
            Yup.string().required('Customer name is required'),
            'Customer name'
        ).min(3, 'Customer name must be at least 3 characters'),
        'Customer name'
    ),

    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().trim(),
});
