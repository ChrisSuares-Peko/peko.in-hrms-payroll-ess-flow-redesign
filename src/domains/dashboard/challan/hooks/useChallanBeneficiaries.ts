import { useCallback, useEffect, useState } from 'react';

import {
    AddBeneficiaryApi,
    deleteBeneficiaryApi,
    getServiceBeneficiary,
    updateBeneficiaryApi,
} from '@src/domains/dashboard/billPayments/api/index';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { ChallanBeneficiary } from '../types/index';

// Saved vehicles (beneficiaries) for the Bill Payments challan flow. Uses the SAME shared
// beneficiary backend as utility/mobile recharge (`/others/beneficiary`, keyed by accessKey),
// storing the vehicle registration number as a `customerParams` entry — no hardcoded list.
export default function useChallanBeneficiaries() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [beneficiaries, setBeneficiaries] = useState<ChallanBeneficiary[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBeneficiaries = useCallback(async () => {
        setIsLoading(true);
        const resp: any = await getServiceBeneficiary({
            userId: id,
            userType: role,
            accessKey: accessKeys.challan,
        });
        const raw: any[] = Array.isArray(resp) ? resp : resp?.beneficiaries || resp?.data || [];
        const mapped: ChallanBeneficiary[] = raw
            .map(b => ({
                id: String(b.id),
                nickname: b.name,
                vehicleNumber:
                    (b.customerParams || []).find((p: any) => p.name === 'vehicleNumber')?.value || '',
            }))
            .filter(b => b.vehicleNumber);
        setBeneficiaries(mapped);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchBeneficiaries();
    }, [fetchBeneficiaries]);

    const addBeneficiary = useCallback(
        async ({ nickname, vehicleNumber }: Omit<ChallanBeneficiary, 'id'>) => {
            // Build as a variable (not an inline literal) so the vehicle `customerParams`
            // passes through — same approach the bill-payment beneficiary flow uses.
            const payload = {
                userId: id,
                userType: role,
                name: nickname,
                accessKey: accessKeys.challan,
                isActive: '1',
                credentialId: String(id),
                customerParams: [{ name: 'vehicleNumber', value: vehicleNumber }],
            };
            const resp = await AddBeneficiaryApi(payload);
            if (resp) await fetchBeneficiaries();
            return resp;
        },
        [id, role, fetchBeneficiaries]
    );

    const editBeneficiary = useCallback(
        async ({ id: beneficiaryId, nickname, vehicleNumber }: ChallanBeneficiary) => {
            const payload = {
                id: Number(beneficiaryId),
                userId: id,
                userType: role,
                name: nickname,
                accessKey: accessKeys.challan,
                isActive: '1',
                credentialId: String(id),
                customerParams: [{ name: 'vehicleNumber', value: vehicleNumber }],
            };
            const resp = await updateBeneficiaryApi(payload);
            if (resp) await fetchBeneficiaries();
            return resp;
        },
        [id, role, fetchBeneficiaries]
    );

    const removeBeneficiary = useCallback(
        async (beneficiaryId: string) => {
            const resp = await deleteBeneficiaryApi({
                userId: id,
                userType: role,
                id: Number(beneficiaryId),
            });
            if (resp) {
                // Same success toast the other utility services show after a beneficiary delete.
                dispatch(
                    showToast({
                        description: resp.message || 'Beneficiary deleted successfully',
                        variant: 'success',
                    })
                );
                await fetchBeneficiaries();
            }
            return resp;
        },
        [id, role, dispatch, fetchBeneficiaries]
    );

    return {
        beneficiaries,
        isLoading,
        addBeneficiary,
        editBeneficiary,
        removeBeneficiary,
        refetch: fetchBeneficiaries,
    };
}
