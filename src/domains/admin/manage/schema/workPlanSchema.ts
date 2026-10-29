import * as Yup from 'yup';

import { withCommissionLimitTest } from '../../utils/commissionValidation';

const nameRegex = /^[A-Za-z0-9\s\-']+$/;

const workPlanSchema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required('Please enter the plan name')
        .min(3, 'Plan name must be at least 3 characters')
        .matches(nameRegex, 'Enter a valid name'),
    description: Yup.string()
        .required('Please enter the description')
        .min(3, 'Description must be at least 3 characters'),
    price: Yup.string().required('Please enter the price'),
    billingCycle: Yup.string().required('Please select the billing cycle'),
    features: Yup.string()
        .required('Please enter the features')
        .min(3, 'Features must be at least 3 characters'),
    status: Yup.boolean().required('Status is required'),
    popular: Yup.boolean().required('Popular status is required'),
    workId: Yup.string().required('Please select the work'),
    commissionMode: Yup.string()
        .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
        .required('Commission Mode is required'),
    commissionType: Yup.string().oneOf(['PERCENTAGE', 'FLAT']).optional(),
    commission: withCommissionLimitTest(Yup.number().min(0).optional(), ['price']),
    fixedCommissionPerTransaction: Yup.number().min(0).optional(),
    isCommissionInclGST: Yup.boolean().optional(),
});

export default workPlanSchema;
