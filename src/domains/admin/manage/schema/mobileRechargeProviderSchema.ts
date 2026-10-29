import * as Yup from 'yup';

import { commissionModeOptions, commissionTypeOptions } from '../types/mobileRechargeProviderTypes';

const commissionModeValues = commissionModeOptions.map(option => option.value);
const commissionTypeValues = commissionTypeOptions.map(option => option.value);

const mobileRechargeProviderSchema = Yup.object().shape({
    providerName: Yup.string()
        .matches(/^[^\s].*$/, 'Provider Name cannot start with a space')
        .required('Provider Name is required'),
    displayName: Yup.string()
        .matches(/^[^\s].*$/, 'Display Name cannot start with a space')
        .required('Display Name is required'),
    commissionMode: Yup.string()
        .oneOf(commissionModeValues, 'Please select a valid commission mode')
        .required('Commission Mode is required'),
    commissionType: Yup.string()
        .oneOf(commissionTypeValues, 'Please select a valid commission type')
        .required('Commission Type is required'),
    commission: Yup.number()
        .typeError('Commission must be a number')
        .min(0, 'Commission cannot be negative')
        .required('Commission is required'),
    fixedCommissionPerTransaction: Yup.number()
        .typeError('Fixed Commission Per Transaction must be a number')
        .min(0, 'Fixed Commission Per Transaction cannot be negative')
        .nullable(),
    isCommissionInclGST: Yup.boolean(),
});

export default mobileRechargeProviderSchema;
