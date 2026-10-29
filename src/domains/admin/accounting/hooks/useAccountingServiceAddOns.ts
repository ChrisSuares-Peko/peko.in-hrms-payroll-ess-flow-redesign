import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getAccountingServiceAddOns,
    updateAccountingServiceAddOn,
    updateAccountingServiceAddOnCommissionStatus,
} from '../api/services';
import { ServiceAddOn } from '../types/services';

export type AddOnValues = {
    price: number;
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
};

export default function useAccountingServiceAddOns(accessKey: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [addOns, setAddOns] = useState<ServiceAddOn[]>([]);
    const [refreshFlag, setRefreshFlag] = useState(false);

    const fetchAddOns = useCallback(async () => {
        if (!accessKey) {
            setAddOns([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await getAccountingServiceAddOns({ userId: id, userType: role, accessKey });
        if (data) setAddOns(data.addOns);
        setIsLoading(false);
    }, [id, role, accessKey]);

    useEffect(() => {
        fetchAddOns();
    }, [fetchAddOns, refreshFlag]);

    const updateAddOn = useCallback(
        async (addOnType: string, values: AddOnValues) => {
            if (!accessKey) return false;
            const resp = await updateAccountingServiceAddOn({
                userId: id,
                userType: role,
                accessKey,
                addOnType,
                ...values,
            });
            if (resp && resp.status) {
                setRefreshFlag(flag => !flag);
                return true;
            }
            return false;
        },
        [id, role, accessKey]
    );

    const toggleAddOnCommissionConfigured = useCallback(
        async (addOn: ServiceAddOn) => {
            if (!accessKey) return false;
            const resp = await updateAccountingServiceAddOnCommissionStatus({
                userId: id,
                userType: role,
                accessKey,
                addOnType: addOn.addOnType,
                isCommissionConfigured: !addOn.commissionConfigured,
            });
            if (resp && resp.status) {
                setRefreshFlag(flag => !flag);
                return true;
            }
            return false;
        },
        [id, role, accessKey]
    );

    return { isLoading, addOns, updateAddOn, toggleAddOnCommissionConfigured };
}
