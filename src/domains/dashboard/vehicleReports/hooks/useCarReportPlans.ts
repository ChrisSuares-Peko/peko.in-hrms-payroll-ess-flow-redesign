import { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { CarReportPlanInfo, getCarReportPlans } from '../api/index';

// Live prices + availability from the admin-managed plans table. The static values in
// reportMeta/data stay as the fallback while loading (or if the fetch fails), so pages
// pass `priceFor(...) ?? staticPrice` and never render an empty price.
const useCarReportPlans = () => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [plans, setPlans] = useState<CarReportPlanInfo[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const data = await getCarReportPlans({ userId, userType });
            if (mounted && data) setPlans(data);
        })();
        return () => {
            mounted = false;
        };
    }, [userId, userType]);

    return useMemo(() => {
        const byKey = new Map(plans.map(p => [`${p.reportType}:${p.packageId ?? ''}`, p]));
        const bookableInspections = plans.filter(p => p.reportType === 'inspection' && p.bookable);
        return {
            plans,
            priceFor: (reportType: string, packageId?: string) =>
                byKey.get(`${reportType}:${packageId ?? ''}`)?.price,
            // The landing card's "Starting at ₹…" — cheapest package Droom can book.
            minInspectionPrice: bookableInspections.length
                ? Math.min(...bookableInspections.map(p => p.price))
                : undefined,
            // undefined = plans not loaded yet (fall back to static), otherwise the
            // plan must exist, be active and be bookable.
            packageAvailable: (packageId: string) =>
                plans.length ? (byKey.get(`inspection:${packageId}`)?.bookable ?? false) : undefined,
            // false only when plans are loaded and the product has no active plan —
            // the landing then shows it as coming soon instead of a dead purchase.
            typeAvailable: (reportType: string) =>
                plans.length
                    ? plans.some(
                          p => p.reportType === reportType && (reportType !== 'inspection' || p.bookable)
                      )
                    : undefined,
        };
    }, [plans]);
};

export default useCarReportPlans;
