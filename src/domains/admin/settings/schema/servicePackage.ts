import * as Yup from 'yup';

import { withCommissionLimitTest } from '../../utils/commissionValidation';

export const servicePackageSchema = Yup.object().shape({
    packageName: Yup.string().required('Please enter the package name'),
    description: Yup.string().optional().trim().min(3, 'Minimum 3 characters required'),
    packageType: Yup.string().required('Please select the package type'),
    packagePrices: Yup.object().shape({
        monthly: Yup.string().required('Please enter the monthly price'),
        annually: Yup.string().required('Please enter the annual price'),
    }),
    discount: Yup.object().shape({
        monthly: Yup.string(),
        annually: Yup.string(),
    }),
    accessCode: Yup.string().when('packageType', {
        is: 'INDIVIDUAL',
        then: schema => schema.required('Please select the access code'),
        otherwise: schema => schema.optional().nullable(),
    }),
    serviceList: Yup.string()
        .trim()
        .when('packageType', {
            is: 'GROUP',
            then: schema =>
                schema
                    .required('Please enter the service list')
                    .min(3, 'Minimum 3 characters required'),
            otherwise: schema => schema.optional().nullable(),
        }),
    priorityLevel: Yup.number().when('packageType', {
        is: 'GROUP',
        then: schema =>
            schema
                .required('Please enter the priority level')
                .positive('Priority level must be greater than zero'),
        otherwise: schema => schema.optional().nullable(),
    }),
    externalId: Yup.string().optional(),
    commissionMode: Yup.string()
        .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
        .when('isPerPeriodCommission', {
            is: false,
            then: schema => schema.required('Commission Mode is required'),
            otherwise: schema => schema.optional(),
        }),
    commissionType: Yup.string().when('isPerPeriodCommission', {
        is: false,
        then: schema => schema.required('Please select the commission type'),
        otherwise: schema => schema.optional(),
    }),
    commission: Yup.string().when('isPerPeriodCommission', {
        is: false,
        then: schema =>
            withCommissionLimitTest(schema.required('Please enter the commission'), [
                'packagePrices.monthly',
                'packagePrices.annually',
            ]),
        otherwise: schema => schema.optional(),
    }),
    fixedCommissionPerTransaction: Yup.string().optional(),
    isCommissionInclGST: Yup.boolean().optional(),
    isPerPeriodCommission: Yup.boolean().optional(),
    planCommissions: Yup.object({
        monthly: Yup.object({
            commissionMode: Yup.string()
                .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
                .required('Commission Mode is required'),
            commissionType: Yup.string().required('Please select the commission type'),
            commission: withCommissionLimitTest(Yup.string().required('Please enter the commission'), [
                'packagePrices.monthly',
            ]),
            fixedCommissionPerTransaction: Yup.string().optional(),
            isCommissionInclGST: Yup.boolean().optional(),
        }),
        annually: Yup.object({
            commissionMode: Yup.string()
                .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
                .required('Commission Mode is required'),
            commissionType: Yup.string().required('Please select the commission type'),
            commission: withCommissionLimitTest(Yup.string().required('Please enter the commission'), [
                'packagePrices.annually',
            ]),
            fixedCommissionPerTransaction: Yup.string().optional(),
            isCommissionInclGST: Yup.boolean().optional(),
        }),
    }).optional().nullable(),
});
