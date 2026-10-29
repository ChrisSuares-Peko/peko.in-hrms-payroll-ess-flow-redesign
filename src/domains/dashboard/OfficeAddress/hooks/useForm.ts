import { useCallback, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useSurchargeApi from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { uploadFiles } from '../api/index';
import { ImageUpload, ImageUploadResponse, WorkspaceFormValues } from '../types/index';

export default function useForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { planId, planName, amount, workspaceId } = useAppSelector(state => state.reducer.plan);
    const [isLoading, setIsLoading] = useState(false);
    const { surchargeData } = useSurchargeApi();

    const total =
        (amount ? parseFloat(amount.toString()) : 0) +
        (surchargeData?.surcharge ? parseFloat(surchargeData.surcharge) : 0);

    const arr: ImageUpload[] = useMemo(() => [], []);

    const uploadLicenses = useCallback(async () => {
        const res: ImageUploadResponse | false = await uploadFiles(
            { userId: id, userType: role },
            { fileUploadData: arr }
        );
        if (res) {
            return res;
        }
        setIsLoading(false);
        return false;
    }, [arr, id, role]);

    const handleSubmission = useCallback(
        async (values: WorkspaceFormValues) => {
            setIsLoading(true);
            arr.push(
                {
                    file: 'txtTradeLicenseDoc',
                    base64String: values.tradeLicenseDoc,
                    imageFormat: values.tradeLicenseFormat!,
                },
                {
                    file: 'txtOwnerVisDoc',
                    base64String: values.visaDoc,
                    imageFormat: values.visaDocFormat!,
                }
            );

            const data = await uploadLicenses();

            if (data) {
                const billSummary = [
                    {
                        key: 'Service type',
                        value: 'Office Address',
                    },
                    {
                        key: 'Plan',
                        value: planName,
                    },
                    {
                        key: 'Company',
                        value: values.companyName,
                    },
                    {
                        key: 'Amount',
                        value: formatNumberWithLocalString(amount),
                    },
                ];

                const paymentSummary = [
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
                    },
                ];

                const requestBody = {
                    amount,
                    planId,
                    workspaceId,
                    userDetails: {
                        companyName: values.companyName,
                        expiryDate: values.expiryDate,
                        licenseType: values.licenseType,
                        fileUploadData: {
                            ownerVisUrl: data.ownerVisUrl,
                            tradeLicenseUrl: data.tradeLicenseUrl,
                        },
                    },
                    accessKey: accessKeys.officeAddress,
                    currentUrl: window.location.href,
                };
                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Bill Summary',
                        payload: requestBody,
                        url: 'officeAndBusiness/workspaces/payment',
                        earningCashbackAmount:
                            Number(surchargeData && surchargeData?.corporateCashback) || 0,
                    })
                );

                navigate(paths.dashboard.payments);
                setIsLoading(false);
            } else {
                dispatch(
                    showToast({
                        description: 'Something went wrong uploading your documents',
                        variant: 'error',
                    })
                );
            }

            return {};
        },
        [
            amount,
            arr,
            dispatch,
            navigate,
            planId,
            planName,
            surchargeData,
            total,
            uploadLicenses,
            workspaceId,
        ]
    );

    return { handleSubmission, isLoading };
}
