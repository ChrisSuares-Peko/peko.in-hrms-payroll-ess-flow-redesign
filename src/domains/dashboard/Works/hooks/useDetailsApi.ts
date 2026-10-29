import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { detailsApi } from '../api/detailsApi';
import { Works } from '../type/index';

export function useDetailsApi(workId: string | undefined) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [works, setWorks] = useState<Works>();
    const [isLoading, setIsLoading] = useState(true);

    const getDetails = useCallback(async () => {
        const data: Works | false = await detailsApi({
            userId: id,
            userType: role,
            workId,
        });
        if (data) {
            setWorks(data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, workId]);

    useEffect(() => {
        getDetails();
    }, [getDetails]);

    return { data: works, isLoading };
}
