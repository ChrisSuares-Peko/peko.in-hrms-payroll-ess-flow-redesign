import { useCallback, useEffect, useState } from 'react';

import { getPackages } from '../api';
import { IndividualPlan, PackagesData, ServicePackage, WhatsAppPlan } from '../types';

export default function useGetPackages() {
    const [tableData, setTableData] = useState<ServicePackage[]>([]);
    const [currentPlanDetails, setCurrentPlanDetails] = useState<{
        currentPackageId: number;
        currentPlanPriorityLevel: number;
        currentBillingType: 'MONTHLY' | 'ANNUALLY' | null;
        currentPlanIsCancelled: boolean;
    }>({
        currentPackageId: 0,
        currentPlanPriorityLevel: 0,
        currentBillingType: null,
        currentPlanIsCancelled: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [whatsappPlans, setWhatsappPlans] = useState<WhatsAppPlan[]>([]);
    const [individualPlans, setIndividualPlans] = useState<IndividualPlan[]>([]);

    const getPackagesLIst = useCallback(async () => {
        setIsLoading(true);
        const data: PackagesData | false = await getPackages();
        if (data) {
            setTableData(data.packages);
            setCurrentPlanDetails({
                currentPackageId: data.currentPackageId,
                currentPlanPriorityLevel: data.currentPlanPriorityLevel,
                currentBillingType: data.currentBillingType ?? null,
                currentPlanIsCancelled: Boolean(data.currentPlanIsCancelled),
            });
            if (data.whatsappPlans) setWhatsappPlans(data.whatsappPlans);
            if (data.individualPlans) setIndividualPlans(data.individualPlans);
            setCount(data.packages.length);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getPackagesLIst();
    }, [getPackagesLIst]);

    return {
        data: tableData,
        isLoading,
        count,
        currentPlanDetails,
        whatsappPlans,
        individualPlans,
    };
}
