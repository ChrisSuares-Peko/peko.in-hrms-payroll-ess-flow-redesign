import * as Yup from 'yup';

export const cancelEWaybillSchema = Yup.object({
    cancelReason: Yup.string().required('Please select the cancel reason'),
});
