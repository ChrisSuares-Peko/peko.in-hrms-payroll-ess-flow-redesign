import * as Yup from 'yup';

import { withCommissionLimitTest } from '../../utils/commissionValidation';

export const catalogSchema = Yup.object().shape({
    amount: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .typeError('Amount must be a number')
        .min(0, 'Amount cannot be negative')
        .nullable(),
    sortOrder: Yup.number()
        .typeError('Order must be a number')
        .min(0, 'Order cannot be negative')
        .required('Order is required'),
    commissionMode: Yup.string()
        .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
        .required('Commission Mode is required'),
    commissionType: Yup.string()
        .required('Please select the commission type')
        .oneOf(['PERCENTAGE', 'FLAT'], 'Commission type must be Percentage or Flat'),
    commission: withCommissionLimitTest(
        Yup.number().required('Please enter commission').min(0, 'Commission must be 0 or greater'),
        ['amount']
    ),
    fixedCommissionPerTransaction: Yup.number().min(0, 'Fixed commission must be 0 or greater'),
    isCommissionInclGST: Yup.boolean(),
});
