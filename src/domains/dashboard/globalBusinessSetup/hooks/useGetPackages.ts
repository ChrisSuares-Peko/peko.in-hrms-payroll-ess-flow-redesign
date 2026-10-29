import { useCallback, useEffect, useState } from 'react';

import { getPackages } from '../api/globalBusinessSetup';
import { PackagesData, ServicePackage } from '../types';

export default function useGetPackages() {
    const [tableData, setTableData] = useState<ServicePackage[]>([]);
    const [currentPlanDetails, setCurrentPlanDetails] = useState({
        currentPackageId: 0,
        currentPlanPriorityLevel: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const [userSaving, setUserSaving] = useState<number>(0);

    const getPackagesLIst = useCallback(async () => {
        setIsLoading(true);
        const data: PackagesData | false = await getPackages();
        if (data) {
            setTableData(data.packages);
            setCurrentPlanDetails({
                currentPackageId: data.currentPackageId,
                currentPlanPriorityLevel: data.currentPlanPriorityLevel,
            });
            setCount(data.packages.length);

            // Step 1: Calculate the total price of individual packages
            const totalIndividualPrice = Number(
                Object.values(data.packages[0].individualPackages).reduce(
                    (sum, price) => sum + parseFloat(price), // Convert price to number here
                    0
                )
            );

            // Step 2: Get the monthly package price
            const monthlyPackagePrice = parseFloat(data.packages[0].packagePrices.monthly);

            // Step 3: Calculate the user saving percentage
            let saving =
                ((totalIndividualPrice - monthlyPackagePrice) / totalIndividualPrice) * 100;

            // Round the saving percentage to the nearest integer
            saving = Math.round(saving);

            setUserSaving(saving);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getPackagesLIst();
    }, [getPackagesLIst]);

    return { data: tableData, userSaving, isLoading, count, currentPlanDetails };
}
