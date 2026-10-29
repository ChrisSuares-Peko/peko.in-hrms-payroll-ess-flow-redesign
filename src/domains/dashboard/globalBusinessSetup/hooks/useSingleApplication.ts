import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getApplicationDetails } from '../api/globalBusinessSetup';
import { SubmittedApplication } from '../types/forms';

const useSingleApplication = (applicationId: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [tableData, setTableData] = useState<SubmittedApplication | null>(null);

    const getSingleApplicationDetails = useCallback(async () => {
        if (!applicationId) return;

        setIsLoading(true);

        const data = await getApplicationDetails({
            userId: id,
            userType: role,
            id: applicationId,
        });
        if (data) {
            setTableData(data);
        }

        setIsLoading(false);
        setRefresh(false);
    }, [id, role, applicationId]);

    useEffect(() => {
        getSingleApplicationDetails();
    }, [getSingleApplicationDetails, refresh, applicationId]);

    return {
        isLoading,
        tableData,
        refetch: getSingleApplicationDetails,
    };
};

export default useSingleApplication;
