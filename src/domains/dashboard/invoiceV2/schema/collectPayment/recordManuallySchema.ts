import * as Yup from 'yup';

import { withSpaceValidation } from '../../utils/yupHelpers';

export const recordManuallySchema = Yup.object().shape({
    amountPaid: Yup.string().trim().required('Amount paid is required'),
    paymentMethod: Yup.string().required('Payment method is required'),
    paymentDate: Yup.string().nullable().required('Payment date is required'),
    referenceId: withSpaceValidation(Yup.string(), 'Reference ID'),
    notes: withSpaceValidation(Yup.string(), 'Notes'),
});
