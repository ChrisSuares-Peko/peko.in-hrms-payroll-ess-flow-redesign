import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    companyProfileApi,
    payrollSettingsApi,
    bankDetailsApi,
    skipDashboard,
} from '../../api/organizationSettings';
import { setRefresh } from '../../slices/orgSettings';
import {
    BankDetailsType,
    GetCompanyProfileType,
    PayrollSettingsType,
} from '../../types/organizationSettings';

export default function useOrganizationSettingsApi() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { refresh } = useAppSelector(state => state.reducer.orgSettings);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const updateCompanyProfile = async (values: any) => {
        const payload = {
            companyProfile: {
                companyName: values.companyName,
                companyAddressLine1: values.companyAddressLine1,
                companyAddressLine2: values.companyAddressLine2,
                city: values.city,
                state: values.state,
                pinCode: values.pinCode,
                contactNumber: values.contactNumber,
                emailAddress: values.emailAddress,
                industry: values.industry,
                companyLogo: values?.companyLogoFormat
                    ? {
                          base64: values?.companyLogo,
                          format: values?.companyLogoFormat,
                      }
                    : values?.companyLogo,
            },
            organizationTaxDetails: {
                PAN: values.PAN,
                TAN: values.TAN,
                TDSCode: values.TDSCode,
                taxPaymentFrequency: values.taxPaymentFrequency,
            },
        };
        const res: GetCompanyProfileType | false = await companyProfileApi({
            ...payload,
            userId: id,
            userType: role,
        });

        if (res) {
            dispatch(
                showToast({
                    description: 'Company profile updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
        }
    };

    const updatePayrollSettings = async (values: PayrollSettingsType) => {
        const payload: any = {
            payrollSettings: {
                selectWorkingDays: values.selectWorkingDays,
                calculateSalaryBasedOn: values.calculateSalaryBasedOn,
                payrollFrom: values.payrollFrom,
                payEmployeeOn: values.payEmployeeOn,
            },
        };
        const resp: any | false = await payrollSettingsApi({
            ...payload,
            userId: id,
            userType: role,
        });

        if (resp) {
            dispatch(
                showToast({
                    description: 'Payroll cycle updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
        }
    };
    const updateSkipDashboard = useCallback(
        async (isSkippedDasboard: boolean) => {
            const payload: any = {
                isSkippedDasboard,
            };
            setIsLoading(true);

            await skipDashboard({
                ...payload,
                userId: id,
                userType: role,
            });
            setIsLoading(false);
        },
        [id, role]
    );

    const updateBankDetails = async (values: BankDetailsType) => {
        const payload = {
            bankDetails: {
                bankName: values.bankName,
                accountNumber: values.accountNumber,
                accountHolderName: values.accountHolderName,
                ifscCode: values.ifscCode,
                branchAddress: values.branchAddress,
            },
        };
        setIsLoading(true);
        const resp: any | false = await bankDetailsApi({
            ...payload,
            userId: id,
            userType: role,
        });
        setIsLoading(false);
        if (resp) {
            dispatch(
                showToast({
                    description: 'Bank details updated successfully',
                    variant: 'success',
                })
            );
            dispatch(setRefresh(!refresh));
            return true;
        }
        return false;
    };

    return {
        updateCompanyProfile,
        updatePayrollSettings,
        updateBankDetails,
        updateSkipDashboard,
        isLoading,
    };
}
