import { useCallback, useEffect, useState } from 'react';

import { getPackageTableDetails } from '../api';
import { DynamicNumberObject, TableDataPackages } from '../types';

export default function useGetPackageTableDetails() {
    const [individualPackages, setIndividualPackages] = useState<DynamicNumberObject>();
    const [groupPackages, setGroupPackages] = useState<DynamicNumberObject>();
    const [groupPackageDiscounts, setGroupPackageDiscounts] = useState<DynamicNumberObject>();
    const [isLoading, setIsLoading] = useState(true);

    const getPackageDetails = useCallback(async () => {
        setIsLoading(true);
        const data: TableDataPackages | false = await getPackageTableDetails();
        if (data) {
            setIndividualPackages(data.tableData.individualPackages);
            setGroupPackages(data.tableData.groupPackages);
            setGroupPackageDiscounts(data.tableData.groupPackageDiscounts);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getPackageDetails();
    }, [getPackageDetails]);

    return { individualPackages, groupPackages, groupPackageDiscounts, isLoading };
}
