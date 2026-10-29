import * as Yup from 'yup';

import { withGstinValidation } from '../utils/yupHelpers';

export const gstinLookupSchema = Yup.object({
    gstin: withGstinValidation(Yup.string().trim().required('Please enter the GSTIN')),
});
