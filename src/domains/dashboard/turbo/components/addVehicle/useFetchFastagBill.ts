import { useEffect, useState } from 'react';

import { fetchBill } from '@src/domains/dashboard/billPayments/api';
import { useAppSelector } from '@src/hooks/store';

const useFetchFastagBill = (verifyRcResponse: any) => {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);

    const [fetching, setFetching] = useState(false);
    const [billData, setBillData] = useState<any>(null);
    const [fetchError, setFetchError] = useState(false);

    const hasSavedProvider = Boolean(
        verifyRcResponse?.fastagBillerId &&
            verifyRcResponse?.fastagRegistration &&
            verifyRcResponse?.fastagParamName
    );

    const runFetchBill = async (
        targetBillerId: string,
        paramName: string,
        paramValue: string
    ) => {
        setFetching(true);
        setFetchError(false);
        const data: any = await fetchBill({
            userType: role,
            userId,
            apiPath: 'fastag',
            billerId: targetBillerId,
            customerParams: { input: { paramName, paramValue } },
        });
        setFetching(false);
        if (data) {
            setBillData(data);
            return true;
        }
        setFetchError(true);
        return false;
    };

    // Auto fetch on load when a provider is already saved on the vehicle
    useEffect(() => {
        if (hasSavedProvider) {
            runFetchBill(
                verifyRcResponse.fastagBillerId,
                verifyRcResponse.fastagParamName,
                verifyRcResponse.fastagRegistration
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        verifyRcResponse?.fastagBillerId,
        verifyRcResponse?.fastagRegistration,
        verifyRcResponse?.fastagParamName,
    ]);

    return {
        role,
        userId,
        fetching,
        billData,
        setBillData,
        fetchError,
        hasSavedProvider,
        runFetchBill,
    };
};

export default useFetchFastagBill;
