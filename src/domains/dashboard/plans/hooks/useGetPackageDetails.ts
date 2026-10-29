import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getPackageDetails, getSubscriptionPricing } from '../api';
import { PackageDetailsResponse, SelectedType } from '../types';

type GetPackageDetailsProps = {
    packageId: number;
    selectedType: SelectedType;
    setTotalPackagePrice: React.Dispatch<React.SetStateAction<number>>;
    couponCode?: string;
};

// Combines two endpoints into the single shape components consumed before the refactor:
//   1. users   GET /subscription/package-details        → static package config
//   2. payGW   GET /payment-gateway/.../subscription-pricing → live discount + addon recurring price
// Pricing math lives only in paymentGateway, so the price shown on the review screen
// is exactly what validatePrice checks against on create-subscription-order.
export default function useGetPackageDetails({
    packageId,
    selectedType,
    setTotalPackagePrice,
    couponCode,
}: GetPackageDetailsProps) {
    const [tableData, setTableData] = useState<PackageDetailsResponse>();
    const [isLoading, setIsLoading] = useState(true);
    const [isRepricing, setIsRepricing] = useState(false);
    const [isError, setIsError] = useState(false);
    const hasLoadedOnce = useRef(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const getPackageDetail = useCallback(async () => {
        if (hasLoadedOnce.current) {
            setIsRepricing(true);
        } else {
            setIsLoading(true);
        }
        setIsError(false);

        const [pkg, pricing] = await Promise.all([
            getPackageDetails(packageId),
            getSubscriptionPricing({
                userId: id,
                userType: role,
                packageId,
                billingType: selectedType === 'annually' ? 'ANNUALLY' : 'MONTHLY',
                couponCode,
            }),
        ]);

        // The static package config is required to render the review card. If it fails, surface an
        // error + retry instead of leaving the card stuck on a skeleton forever.
        if (!pkg) {
            setIsError(true);
            setIsLoading(false);
            setIsRepricing(false);
            dispatch(
                showToast({
                    variant: 'error',
                    description: "Couldn't load this plan's details. Please try again.",
                })
            );
            return;
        }

        const pricingData = pricing || null;
        const merged: PackageDetailsResponse = {
            packageDetails: pkg.packageDetails,
            discount: pricingData ? pricingData.breakdown : { price: 0, breakdown: [] },
            annualAddonPrice: pricingData?.annualAddonPrice ?? 0,
            monthlyAddonPrice: pricingData?.monthlyAddonPrice ?? 0,
            expectedPaymentAmount: pricingData?.expectedPaymentAmount,
            taxableAmount: pricingData?.taxableAmount,
            taxAmount: pricingData?.taxAmount,
            taxRate: pricingData?.taxRate,
            couponDiscount: pricingData?.couponDiscount,
        };

        // Use the backend's expected amount — guarantees the UI total matches what
        // validatePrice will accept.
        if (pricingData && typeof pricingData.expectedPaymentAmount === 'number') {
            setTotalPackagePrice(pricingData.expectedPaymentAmount);
        } else {
            setIsError(true);
            setIsLoading(false);
            setIsRepricing(false);
            dispatch(
                showToast({
                    variant: 'error',
                    description: "Couldn't load this plan's pricing. Please try again.",
                })
            );
            return;
        }

        setTableData(merged);
        hasLoadedOnce.current = true;
        setIsLoading(false);
        setIsRepricing(false);
    }, [packageId, selectedType, setTotalPackagePrice, couponCode, id, role, dispatch]);

    useEffect(() => {
        getPackageDetail();
    }, [getPackageDetail]);

    return { data: tableData, isLoading, isRepricing, isError, refetch: getPackageDetail };
}
