import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { DropDown, SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createDocument, updateDocument, getpartner } from '../api/ipWhitelist';
import { categoryData, categoryResponse } from '../types/ipWhitelist';

const useUpdateIpWhitelisting = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const [partnerDatas, setPartnerDatas] = useState<DropDown>([
        { value: 'default', label: 'Default' },
    ]);
    const updateDoc = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<any> | false = await updateDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `IP address updated successfully`,
                        variant: 'success',
                    })
                );
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role, dispatch]
    );
    const createDoc = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<any> | false = await createDocument({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `IP address added successfully`,
                        variant: 'success',
                    })
                );
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role, dispatch]
    );
    const getPartners = useCallback(async () => {
        setIsLoading(true);
        const data: categoryResponse | false = await getpartner({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const partners = data.data.map((item: categoryData) => ({
                value: item.id.toString(),
                label: item.name,
            }));
            setPartnerDatas([{ value: 'default', label: 'Default' }, ...partners]);
        }
        setIsLoading(false);
    }, [id, role, searchText]);

    useEffect(() => {
        getPartners();
    }, [getPartners]);
    return { isLoading, createDoc, updateDoc, partnerDatas };
};

export default useUpdateIpWhitelisting;
