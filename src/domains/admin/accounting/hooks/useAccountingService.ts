import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getAccountingService,
    updateAccountingServiceCommission,
    updateAccountingServiceCommissionStatus,
    updateAccountingServiceVendor,
} from '../api/services';
import { AccountingService } from '../types/services';

type CommissionUpdatePayload = {
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
};

type VendorUpdatePayload = {
    vendorName: string;
    state: string;
    gstNo: string;
    address: string;
    vendorEmail: string[];
};

export default function useAccountingService(accessKey: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [service, setService] = useState<AccountingService | null>(null);

    const fetchService = useCallback(async () => {
        if (!accessKey) {
            setService(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const data = await getAccountingService({ userId: id, userType: role, accessKey });
        setService(data || null);
        setIsLoading(false);
    }, [id, role, accessKey]);

    useEffect(() => {
        fetchService();
    }, [fetchService]);

    const updateCommission = useCallback(
        async (values: CommissionUpdatePayload) => {
            if (!service) return false;
            const resp = await updateAccountingServiceCommission({
                userId: id,
                userType: role,
                id: service.id,
                ...values,
            });
            if (resp && resp.status) {
                await fetchService();
                return true;
            }
            return false;
        },
        [id, role, service, fetchService]
    );

    const updateVendor = useCallback(
        async (values: VendorUpdatePayload) => {
            if (!service?.vendor) return false;
            const resp = await updateAccountingServiceVendor({
                userId: id,
                userType: role,
                id: service.vendor.id,
                ...values,
            });
            if (resp && resp.status) {
                await fetchService();
                return true;
            }
            return false;
        },
        [id, role, service, fetchService]
    );

    const toggleCommissionConfigured = useCallback(async () => {
        if (!service) return false;
        const resp = await updateAccountingServiceCommissionStatus({
            userId: id,
            userType: role,
            id: service.id,
            isCommissionConfigured: !service.commissionConfigured,
        });
        if (resp && resp.status) {
            await fetchService();
            return true;
        }
        return false;
    }, [id, role, service, fetchService]);

    return {
        isLoading,
        service,
        notFound: !isLoading && service === null,
        refetch: fetchService,
        updateCommission,
        updateVendor,
        toggleCommissionConfigured,
    };
}
