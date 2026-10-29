import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listAllCompanyDocs } from '../../api/companyDoc';
import { CompanyDocInfoResponse } from '../../types/companyDoc';

export const useGetInfoCardAllDocApi = (reloadTable: boolean) => {
    const initialInfoDetails = {
        totalDocuments: 0,
        activeDocuments: 0,
        expiredDocuments: 0,
        completionLevel: 0,
    };
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState(initialInfoDetails);
    const [isLoading, setIsLoading] = useState(true);
    const getCompanyDocList = useCallback(async () => {
        setIsLoading(true);
        const data: CompanyDocInfoResponse | false = await listAllCompanyDocs({
            userId: id,
            userType: role,
        });

        if (data) {
            setInfoDetails({
                activeDocuments: data.activeDocuments,
                completionLevel: Number(data.completionLevel),
                expiredDocuments: data.expiredDocuments,
                totalDocuments: data.totalDocuments,
            });
        }
        setIsLoading(false);
    }, [id, role]);
    useEffect(() => {
        getCompanyDocList();
    }, [getCompanyDocList, reloadTable]);

    return {
        tableLoading: isLoading,
        infoDetails,
    };
};
