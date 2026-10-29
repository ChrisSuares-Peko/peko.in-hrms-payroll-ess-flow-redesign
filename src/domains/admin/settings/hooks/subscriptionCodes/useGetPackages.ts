import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPackagesApi } from '../../api/cashback';
import { getPackagesApiResp, packages } from '../../types/cashback';

type PROPS = {
    partnerId: string | null;
};

const useGetPackages = (props: PROPS) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [packageData, setPackageData] = useState<
        {
            label: string;
            value: number;
        }[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [partnerId, setPartnerId] = useState(props.partnerId || '');

    const getAllPackages = useCallback(async () => {
        setIsLoading(true);
        const data: getPackagesApiResp | false = await getPackagesApi({
            userId: id,
            userType: role,
            partnerId,
            excludeBasic: true,
            excludeServicePackages: true,
        });
        if (data) {
            const arr = data.data.map((item: packages) => ({
                value: item.id,
                label: item.packageName,
            }));
            setPackageData(arr);
        }
        setIsLoading(false);
    }, [id, role, partnerId]);

    useEffect(() => {
        getAllPackages();
    }, [getAllPackages]);

    return {
        isLoading,
        packageData,
        setPartnerId,
    };
};

export default useGetPackages;
