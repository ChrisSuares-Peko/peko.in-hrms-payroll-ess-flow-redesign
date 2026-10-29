import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { createBanner, getDeviceType, updateBanner } from '../api/banners';
import { Banner, DeviceTypeData, NewBanner } from '../types/banners';

const useUpdateBanner = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [categoryData, setCategoryData] = useState<DropDown>();

    const getAllCategories = useCallback(async () => {
        const data: DeviceTypeData | false = await getDeviceType({
            userId: id,
            userType: role,
        });
        if (data) {
            setCategoryData(data.deviceType);
        }
    }, [id, role]);

    const updateCurrentBanner = useCallback(
        async (payload: NewBanner) => {
            setIsLoading(true);
            const data: Banner | false = await updateBanner({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const createNewBanner = useCallback(
        async (payload: NewBanner) => {
            setIsLoading(true);
            const data: Banner | false = await createBanner({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    useEffect(() => {
        getAllCategories();
    }, [getAllCategories]);

    return { isLoading, createNewBanner, updateCurrentBanner, categoryData };
};

export default useUpdateBanner;
