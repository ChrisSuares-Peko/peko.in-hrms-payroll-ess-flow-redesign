import * as Yup from 'yup';

import { withSpaceValidation } from '../../utils/yupHelpers';

export const cancelIrnSchema = Yup.object({
    cancelReason: Yup.string().required('Please select the cancel reason'),
    remarks: withSpaceValidation(Yup.string().required('Please enter the remarks'), 'Remarks'),
});
