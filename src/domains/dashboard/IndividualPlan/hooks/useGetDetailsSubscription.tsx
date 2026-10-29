import { useCallback, useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { PAYROLL_ONBOARDING_ROOT } from '@src/prototype/essSession';
import { buildDemoSubscription } from '@src/prototype/payrollSeed';

import { getPurchaseDetailsApi } from '../api';
import { SubscriptionDetailsResponse } from '../types';

export function useGetDetailsSubscription(accessKey: string, serviceAccessKey?: string) {
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionDetailsResponse | null>(
        null
    );

    const [isLoading, setIsLoading] = useState(true);
    // PROTOTYPE-SETUP: no session token -> seeded subscription: purchased everywhere except the
    // /onboarding/payroll/* flow, which shows the pre-purchase landing as its first step.
    const { token } = useAppSelector(state => state.reducer.auth);
    const isPayrollOnboarding = useLocation()
        .pathname.toLowerCase()
        .startsWith(PAYROLL_ONBOARDING_ROOT);

    const getSubscriptionData = useCallback(async () => {
        if (!token) {
            setSubscriptionData(buildDemoSubscription(!isPayrollOnboarding));
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const resp: SubscriptionDetailsResponse | false = await getPurchaseDetailsApi(
            accessKey,
            serviceAccessKey
        );
        if (resp) {
            setSubscriptionData(resp);
            sessionStorage.setItem(
                'subscriptionDetails',
                JSON.stringify({ isPurchased: resp.isPurchased })
            );
        }
        setIsLoading(false);
    }, [accessKey, serviceAccessKey, token, isPayrollOnboarding]);

    useEffect(() => {
        getSubscriptionData();
        return () => {
            sessionStorage.removeItem('subscriptionDetails');
        };
    }, [getSubscriptionData]);

    const dismissSubscriptionLanding = useCallback(() => {
        setSubscriptionData(prev => (prev ? { ...prev, showSubscriptionLanding: false } : prev));
    }, []);

    return { isLoading, subscriptionData, dismissSubscriptionLanding };
}
