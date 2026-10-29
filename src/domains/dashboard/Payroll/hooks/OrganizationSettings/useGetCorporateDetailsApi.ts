import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCorporateorporateDetails } from '../../api/organizationSettings/index';
import { CompanyUserData } from '../../types/organizationSettings/index';

export default function useCorporateDetailsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [tableData, setTableData] = useState<CompanyUserData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getCorporateDetails = useCallback(async () => {
        setIsLoading(true);

        const data: CompanyUserData | false = await getCorporateorporateDetails({
            userId: id,
            userType: role,
        });
        if (data) {
            setTableData(data);
        } else {
            setTableData(null);
        }

        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getCorporateDetails();
    }, [getCorporateDetails]);

    return {
        tableData,
        loader: isLoading,
    };
}
