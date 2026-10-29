import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCompatibleDeviceList } from '../api/index';
import { Device, DeviceList } from '../types/compatibleDeviceType';

export default function useGetCompatibleDevice() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [compatibleDevice, setCompatibleDevice] = useState<Device[]>();
    const [isLoading, setIsLoading] = useState(true);

    const getCompatibleDevice = useCallback(async () => {
        setIsLoading(true);
        const data: DeviceList | false = await getCompatibleDeviceList({
            userId: id,
            userType: role,
        });
        if (data) {
            setCompatibleDevice(data.deviceList);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getCompatibleDevice();
    }, [getCompatibleDevice]);

    return { compatibleDeviceList: compatibleDevice, getCompatibleDevice, isLoading };
}
