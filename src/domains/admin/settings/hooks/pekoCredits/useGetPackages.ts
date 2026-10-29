import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';
import { packageAccessKeys } from '@utils/packageAccessKeys';

// import { getServicePackagesApi } from '../../api/cashback';
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
            excludeServicePackages: false,
        });
        if (data) {
            // Only service packages (type '2') are named after their service; regular packages keep their own name.
            const arr = data.data.map((item: packages) => {
                const serviceName = Object.entries(packageAccessKeys).find(
                    ([, accessCode]) => accessCode === item.accessCode
                )?.[0];
                return {
                    value: item.id,
                    label:
                        serviceName && item.type === '2'
                            ? `${serviceName} - ${item.packageName}`
                            : item.packageName,
                };
            });
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
        partnerId,
    };
};

export default useGetPackages;
