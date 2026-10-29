import * as Yup from 'yup';

import { withLetterRequired, withSpaceValidation } from '../../utils/yupHelpers';

export const agreementDetailsSchema = Yup.object().shape({
    title: withLetterRequired(
        withSpaceValidation(
            Yup.string().required('Please enter the agreement title'),
            'Agreement title'
        )
            .min(3, 'Agreement title must be at least 3 characters')
            .max(100, 'Agreement title cannot exceed 100 characters'),
        'Agreement title'
    ),
    // contractValue: Yup.string().trim().required('Contract value is required'),
    contractType: Yup.string().required('Contract type is required'),
    paymentTerms: Yup.string().nullable().notRequired(),
    currency: Yup.string().required('Currency is required'),
    // billingFrequency: Yup.string().trim().required('Billing frequency is required'),
    startDate: Yup.string().required('Start date is required'),
    // endDate: Yup.string().nullable().required('End date is required'),
    description: Yup.string().trim().nullable().notRequired(),
    // specialTerms: Yup.string().trim(),
});
