import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchLegalTemplates } from '../api';
import type { LegalTemplate } from '../types';

const DEFAULT_ITEMS_PER_PAGE = 12;

const useLegalTemplates = (searchText?: string, category?: string, page?: number, itemsPerPage?: number) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [templates, setTemplates] = useState<LegalTemplate[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchLegalTemplates({
            userId: id,
            userType: role,
            searchText: searchText || '',
            page: page || 1,
            itemsPerPage: itemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
            category: category || undefined,
        });
        if (data && data.data) {
            setTemplates(
                data.data.map((t: any) => ({
                    id: String(t.id),
                    title: t.title,
                    description: t.description,
                    timeEstimate: t.timeEstimate,
                    category: t.category,
                    iconKey: t.iconKey,
                }))
            );
            setTotal(data.count ?? 0);
        }
        setIsLoading(false);
    }, [id, role, searchText, page, category, itemsPerPage]);

    useEffect(() => { load(); }, [load]);

    return { templates, total, isLoading };
};

export default useLegalTemplates;
