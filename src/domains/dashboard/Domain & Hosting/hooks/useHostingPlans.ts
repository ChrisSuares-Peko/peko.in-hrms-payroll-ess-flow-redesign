import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getHostingPlansByType } from '../api/index';

export interface PlanFeature {
    label: string;
    value: string;
}

export interface SupportedOS {
    os_display_name: string;
    os_name: string;
    is_discontinued: boolean;
    is_default: boolean;
    addons: Array<{
        addon_name: string;
        is_paid: boolean;
        group_name: string;
        free_quantity: number;
        supported_quantity: number;
        prerequisite_addons: string[];
        conflicting_addon_names: string[];
    }>;
}

export interface HostingPlan {
    id: number;
    planName: string;
    productId: string;
    planId: string;
    description: string | null;
    features: PlanFeature[];
    price: number | null;
    pricingDetails: {
        add?: Record<string, number>;
        renew?: Record<string, number>;
    };
    addons?: Record<string, number>;
    vendorDetails: {
        // Shared hosting fields
        hosting_location?: string;
        no_of_domains?: string;
        webspace?: string;
        no_of_mail_accounts?: string;
        noofdbs?: string;
        // VPS fields
        supported_os?: SupportedOS[];
        plan_status?: string;
        hosting_type?: string;
        diskType?: string;
        ram?: number;
        cpu?: number;
        bandwidth?: number | string;
        space?: number;
        [key: string]: any;
    };
}

export default function useHostingPlans(planType: string, options?: { lazy?: boolean }) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [plans, setPlans] = useState<HostingPlan[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPlans = useCallback(async (params?: { serverLocation?: string }) => {
        setIsLoading(true);
        const data = await getHostingPlansByType({ userId: id, userType: role, planType, ...params });
        if (data?.plans) {
            const normalized = data.plans.map((plan: any) => ({
                ...plan,
                features: (plan.features || []).map((f: any) =>
                    typeof f === 'string' ? { label: f, value: '' } : f
                ),
            }));
            setPlans(normalized);
        }
        setIsLoading(false);
    }, [id, role, planType]);

    useEffect(() => {
        if (!options?.lazy) fetchPlans();
    }, [fetchPlans, options?.lazy]);

    return { plans, isLoading, fetchPlans };
}
