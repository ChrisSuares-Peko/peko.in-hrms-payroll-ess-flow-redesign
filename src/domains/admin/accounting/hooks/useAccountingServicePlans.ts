import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getAccountingServicePlans,
    updateAccountingServicePlanCommission,
    updateAccountingServicePlanCommissionBulk,
    updateAccountingServicePlanCommissionStatus,
} from '../api/services';
import { AccountingServicePlansFilters, ServicePlan, SplitCommission } from '../types/services';

export type PlanCommissionValues = {
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
    splitCommission?: SplitCommission | null;
    price?: number;
    annualPrice?: number;
    discount?: number;
    annualDiscount?: number;
};

// `supported` is false for services with no registered plan entity (e.g. ecommerce_store).
export default function useAccountingServicePlans(
    accessKey: string | undefined,
    filters: AccountingServicePlansFilters
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [supported, setSupported] = useState(true);
    const [plans, setPlans] = useState<ServicePlan[]>([]);
    const [count, setCount] = useState(0);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const fetchPlans = useCallback(async () => {
        if (!accessKey) {
            setPlans([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await getAccountingServicePlans({
            userId: id,
            userType: role,
            accessKey,
            ...filters,
        });
        if (data) {
            setSupported(data.supported);
            setPlans(data.plans);
            setCount(data.recordsTotal);
        }
        setIsLoading(false);
    }, [id, role, accessKey, filters]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans, refreshFlag]);

    const updatePlanCommission = useCallback(
        async (planId: number, values: PlanCommissionValues) => {
            if (!accessKey) return false;
            const resp = await updateAccountingServicePlanCommission({
                userId: id,
                userType: role,
                accessKey,
                planId,
                ...values,
            });
            if (resp && resp.status) {
                setRefreshFlag(f => !f);
                return true;
            }
            return false;
        },
        [id, role, accessKey]
    );

    const updatePlanCommissionBulk = useCallback(
        async (planIds: number[], values: PlanCommissionValues) => {
            if (!accessKey) return false;
            const resp = await updateAccountingServicePlanCommissionBulk({
                userId: id,
                userType: role,
                accessKey,
                planIds,
                ...values,
            });
            if (resp && resp.status) {
                setRefreshFlag(f => !f);
                return true;
            }
            return false;
        },
        [id, role, accessKey]
    );

    const togglePlanCommissionConfigured = useCallback(
        async (plan: ServicePlan) => {
            if (!accessKey) return false;
            const resp = await updateAccountingServicePlanCommissionStatus({
                userId: id,
                userType: role,
                accessKey,
                planId: plan.id,
                isCommissionConfigured: !plan.commissionConfigured,
            });
            if (resp && resp.status) {
                setRefreshFlag(f => !f);
                return true;
            }
            return false;
        },
        [id, role, accessKey]
    );

    return {
        isLoading,
        supported,
        plans,
        count,
        updatePlanCommission,
        updatePlanCommissionBulk,
        togglePlanCommissionConfigured,
    };
}
