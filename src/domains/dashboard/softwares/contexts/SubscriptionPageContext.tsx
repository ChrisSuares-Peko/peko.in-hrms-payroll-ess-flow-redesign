import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { NavigateFunction, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { SurchargeResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';
import { fetchProductDetails } from '../api';
import { setLastViewedWeburl } from '../slice/softwareSlice';
import { IPlan, IProduct } from '../types';

type HandleSoftwareSubmission = {
    plan: IPlan;
    amount: string;
    company: string;
};
type SubscriptionContextType = {
    product: IProduct | null;
    isLoading: boolean;
    navigate: NavigateFunction;
    weburl: string;
      handleSoftwareSubmission: ({ plan, amount, company }: HandleSoftwareSubmission) => void;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscriptionContext = () => {
    const context = useContext(SubscriptionContext);

    if (!context) {
        throw new Error('useSubscriptionContext must be used within SubscriptionContextProvider');
    }

    return context;
};

type Props = {
    children: React.ReactNode;
};

const SubscriptionContextProvider = ({ children }: Props) => {
    const location = useLocation();

    const state = location.state as { product?: IProduct } | undefined;

    const [product, setProduct] = useState<IProduct | null>(state?.product ?? null);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [searchParams] = useSearchParams();

    const rawWeburl = searchParams.get('weburl');
    const navigate = useNavigate();
    const { role, id } = useAppSelector(store => store.reducer.auth);
    const lastViewedWeburl = useAppSelector(store => store.reducer.software.lastViewedWeburl);

    const dispatch = useAppDispatch();

    const effectiveWeburl = rawWeburl ?? lastViewedWeburl;
    const weburl = effectiveWeburl;

    useEffect(() => {
        if (rawWeburl) {
            dispatch(setLastViewedWeburl(rawWeburl));
        }
    }, [rawWeburl, dispatch]);

    useEffect(() => {
        if (!effectiveWeburl) {
            navigate(paths.softwares.index, { replace: true });
        }
    }, [effectiveWeburl, navigate]);

    const getProductDetails = useCallback(async () => {
        if (!effectiveWeburl || !id || !role) return;
        setIsLoading(true);

        const data = await fetchProductDetails({
            userId: id,
            userType: role,
            weburl: effectiveWeburl,
        });

        if (data && data.product) setProduct(data.product);
        else navigate(paths.softwares.index, { replace: true });

        setIsLoading(false);
    }, [effectiveWeburl, id, role, navigate]);

    useEffect(() => {
        if (!product && effectiveWeburl) {
            getProductDetails();
        }
    }, [product, effectiveWeburl, getProductDetails]);

    const handleSoftwareSubmission = useCallback(
        async ({ plan, amount, company }: HandleSoftwareSubmission) => {
            const { productName } = plan;
            setIsLoading(true);
            // need to write a func to verify first the balance is available or not
            const data: SurchargeResponse | false = await getSurcharge({
                userId: id,
                userType: role,
                amount: Number(amount),
                accessKey: accessKeys.softwares,
            });

            if (!data) {
                setIsLoading(false);
                return;
            }

            const total =
                (amount ? Number(amount) : 0) + (data?.surcharge ? parseFloat(data.surcharge) : 0);

            const billSummary = [
                { key: 'Service name', value: 'Softwares' },
                { key: 'Software', value: productName || '' },
                { key: 'Company', value: company || '' },
                { key: 'Amount', value: amount ?? 0 },
            ];

            const paymentSummary = [
                { key: 'Subtotal', value: `₹ ${formatNumberWithLocalString(amount)}` },
                {
                    key: 'Platform fee (inclusive of VAT)',
                    value: formatNumberWithLocalString(data.surcharge ?? 0),
                },
            ];

            const requestBody = {
                plan,
                amount: String(amount),
                accessKey: accessKeys.softwares,
                currentUrl: window.location.href,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'purchase/softwaresV2/payment',
                    earningCashbackAmount: Number(data?.surcharge && data?.corporateCashback) || 0,
                })
            );
            navigate(paths.dashboard.payments);
            setIsLoading(false);
        },
        [dispatch, id, role, navigate]
    );

    const value = useMemo(
        () => ({
            product,
            isLoading,
            navigate,
            weburl,
            handleSoftwareSubmission,
        }),
        [product, isLoading, navigate, weburl, handleSoftwareSubmission]
    );

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export default SubscriptionContextProvider;
