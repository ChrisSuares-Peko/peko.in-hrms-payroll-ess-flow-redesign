import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchPersonalTemplates } from '../api';

const usePersonalTemplates = (limit?: number, searchText?: string, page?: number) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [templates, setTemplates] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const result = await fetchPersonalTemplates({ userId: id, userType: role, limit, searchText, page });
        if (result) {
            setTemplates(result.data ?? []);
            setTotal(result.count ?? 0);
        }
        setIsLoading(false);
    }, [id, role, limit, searchText, page]);

    useEffect(() => { load(); }, [load]);

    return { templates, total, isLoading };
};

export default usePersonalTemplates;
