import * as Yup from 'yup';

import { withCommissionLimitTest } from '../../utils/commissionValidation';

const commissionFields = {
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
};

export const esimPlanSchema = Yup.object().shape({
    coverage: Yup.string().required('Please select the coverage'),
    country: Yup.string().required('Please select a country'),
    dataMBs: Yup.number()
        .required('Please specify the data pack')
        .min(1, 'Data pack must be at least 1 MB'),
    periodDays: Yup.number()
        .required('Please specify the validity')
        .min(1, 'Validity must be at least 1 day')
        .max(30, 'Validity must be at most 30 days'),
    amount: Yup.number()
        .required('Please specify the amount')
        .positive('Amount must be greater than zero')
        .max(999999.9999, 'Amount cannot exceed 999999.9999'),
    ...commissionFields,
});

export const esimPlanEditSchema = Yup.object().shape(commissionFields);

export const esimPlanOpenEditSchema = Yup.object().shape({
    dataMBs: Yup.number()
        .required('Please specify the data pack')
        .min(1, 'Data pack must be at least 1 MB'),
    periodDays: Yup.number()
        .required('Please specify the validity')
        .min(1, 'Validity must be at least 1 day')
        .max(30, 'Validity must be at most 30 days'),
    amount: Yup.number()
        .required('Please specify the amount')
        .positive('Amount must be greater than zero')
        .max(999999.9999, 'Amount cannot exceed 999999.9999'),
    ...commissionFields,
});
