import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getFinancialInfo } from '../../api/financialDoc';
import { FinancialInfoResponse } from '../../types/financials';

export const useGetFinancialInfoApi = (reloadTable: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState({
        totalCheques: 0,
        totalFiles: 0,
        completed: 0,
        pending: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const getFinancialInfoCardData = useCallback(async () => {
        setIsLoading(true);
        const data: FinancialInfoResponse | false = await getFinancialInfo({
            userId: id,
            userType: role,
        });

        if (data) {
            setInfoDetails({
                totalCheques: data.totalCheques,
                totalFiles: data.totalDocuments,
                completed: data.chequesCleared,
                pending: data.chequesPending,
            });
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getFinancialInfoCardData();
    }, [getFinancialInfoCardData, reloadTable]);

    return {
        tableLoading: isLoading,
        infoDetails,
    };
};
