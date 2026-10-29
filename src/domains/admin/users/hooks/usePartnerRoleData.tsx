import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createPartner, getPartnerdetails, updatePartner } from '../api';
import { activeResponse } from '../types/systemUserTypes';

export type PartnerDataType = {
    value: string | number;
    label: string;
};

const usePartnerRoleData = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const [partnerData, setPartnerData] = useState<any[]>();

    const getPartnerData = useCallback(
        async (partnerId?: string) => {
            setLoading(true);
            const data: any | false = await getPartnerdetails({
                userId: id,
                userType: role,
                partnerId,
            });
            if (data) {
                const partners = data.data.map((item: any) => ({
                    packageId: item.packageId,
                    value: item.packageId,
                    label: item.package.packageName,
                    hasAccess: true,
                    serviceOperators: item.serviceOperators.map((operator: any) => ({
                        id: operator.id,
                        serviceProvider: operator.serviceProvider,
                        accessKey: operator.accessKey,
                        hasAccess: true,
                    })),
                }));
                setPartnerData(partners);
            }
            setLoading(false);
        },
        [id, role]
    );
    const createPartnerRole = useCallback(
        async (payload: any) => {
            setLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await createPartner({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                setLoading(false);
                return data;
            }
            setLoading(false);
            return false;
        },
        [id, role]
    );
    const updatePartnerRole = useCallback(
        async (partnerId: string, payload: any) => {
            setLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await updatePartner({
                userId: id,
                userType: role,
                ...payload,
                id: partnerId,
            });

            if (data) {
                setLoading(false);
                return data;
            }
            setLoading(false);
            return false;
        },
        [id, role]
    );
    return { getPartnerData, loading, partnerData, createPartnerRole, updatePartnerRole };
};

export default usePartnerRoleData;
