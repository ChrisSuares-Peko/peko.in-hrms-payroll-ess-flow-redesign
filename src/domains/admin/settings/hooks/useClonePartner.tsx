import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createClone, getClonePartnerFrom, getClonePartnerTo } from '../api/partnerPermission';
import {
    activeResponse,
    ClonePartner,
    Permission,
    updateClonePartner,
} from '../types/partnerPermission';

export type PartnerDataType = {
    value: string | number | null;
    label: string;
};

const useClonePartner = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [permissionData, setPermissionData] = useState<Permission[]>();
    const [partnerData, setPartnerData] = useState<PartnerDataType[]>([
        { value: null, label: 'Default' },
    ]);
    const [partnerDataTo, setPartnerDataTo] = useState<PartnerDataType[]>([]);
    const [fullPartnerData, setFullPartnerData] = useState<ClonePartner[]>();
    const [isloading, setIsLoading] = useState(false);
    const getPartnerFrom = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getClonePartnerFrom({
            userId: id,
            userType: role,
        });
        if (data && data.data) {
            setFullPartnerData(data.data);
            const transformedPartnerData = data.data.map((partner: any) => ({
                value: partner.id,
                label: partner.name,
            }));
            setPartnerData([
                // { value: null, label: 'Default' }, // Retain default option
                ...transformedPartnerData,
            ]);
            setPermissionData(data.data[0]?.permissions || []);
            setIsLoading(false);
        }
    }, [id, role]);

    const getPartnerTo = useCallback(async () => {
        setIsLoading(true);
        const data: any | false = await getClonePartnerTo({
            userId: id,
            userType: role,
        });
        if (data) {
            const transformedPartnerData = data.data.map((item: any) => ({
                value: item.id,
                label: item.name,
            }));
            setPartnerDataTo(transformedPartnerData);
            setIsLoading(false);
        }
    }, [id, role]);
    const createClonePartner = useCallback(
        async (payload: updateClonePartner) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await createClone({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                setIsLoading(false);
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return {
        getPartnerFrom,
        isloading,
        permissionData,
        partnerData,
        fullPartnerData,
        getPartnerTo,
        partnerDataTo,
        createClonePartner,
    };
};

export default useClonePartner;
