import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { updatePekoCreditState } from '@src/slices/userSlice';

import { getPekoCredits } from '../api';
import { PekoCreditsResponse, CouponCode } from '../types/type';

export function usePekoCreditListApi(
    page: number,
    length: number,
    accessKey?: string,
    packageId?: number | string,
    billingType?: string
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [creditsData, setCreditsData] = useState<CouponCode[]>([]);
    const [isPekoCreditActive, setIsPekoCreditActive] = useState<boolean>(false);
    const [pekoCreds, setPekoCreds] = useState<string>('0');
    const [count, setCount] = useState<number>(0);

    const fetchCreditsData = useCallback(async () => {
        if (role !== 'corporate') return;
        setIsLoading(true);
        const data: PekoCreditsResponse['data'] | null = await getPekoCredits({
            userId: id,
            userType: role,
            page,
            length,
            accessKey,
            packageId,
            billingType,
        });

        if (data) {
            const formattedData = data?.couponCodes.map(item => ({
                serviceName: item.serviceName ?? '',
                discount: item.discount ?? 0,
                couponCode: item.couponCode ?? '',
                isClaimed: item.isClaimed ?? false,
                validity: item.validity ?? '',
                discountType: item.discountType ?? '',
                minimumPurchase: item.minimumPurchase ?? '',
                maximumDiscount: item.maximumDiscount ?? '',
                billingType: item.billingType ?? '',
                couponType: item.couponType ?? '',
            }));

            setCreditsData(formattedData);
            setCount(data.recordsTotal);
            setIsPekoCreditActive(data.isPekoCreditActive);
            const credits = (Math.floor(data.pekoCredits * 100) / 100).toFixed(2);
            setPekoCreds(credits ?? 0);
            dispatch(
                updatePekoCreditState({
                    isPekoCreditActive: !!data,
                    pekoCredits: credits ?? 0,
                })
            );
        }
        setIsLoading(false);
    }, [accessKey, billingType, dispatch, id, length, packageId, page, role]);

    useEffect(() => {
        fetchCreditsData();
    }, [fetchCreditsData]);

    return { creditsData, isPekoCreditActive, isLoading, pekoCreds, count };
}
