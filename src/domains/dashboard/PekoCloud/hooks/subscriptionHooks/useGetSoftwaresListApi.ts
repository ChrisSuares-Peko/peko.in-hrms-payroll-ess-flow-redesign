import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listSoftwares } from '../../api/subscriptions';
import { SoftwareListingResponse } from '../../types/subscriptions';

export function useGetSoftwaresList() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [softwares, setSoftwares] = useState<any[]>([]);
    const allSoftwaresList = useCallback(async () => {
        const data: SoftwareListingResponse | false = await listSoftwares({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                name: item.name ?? '',
                image: item.image ?? '',
                id: item.id ?? '',
            }));

            setSoftwares(arr);
        }
    }, [role, id]);

    useEffect(() => {
        allSoftwaresList();
    }, [allSoftwaresList]);

    const generateSoftwaresDropdown = (data: any[]) =>
        data.map(software => ({
            value: software.id,
            label: software.name,
        }));
    return { softwaresData: softwares, generateSoftwaresDropdown };
}
