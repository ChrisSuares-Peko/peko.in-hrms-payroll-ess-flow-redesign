import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchTemplateById } from '../api';
import type { LegalTemplateDetail } from '../types';

const useTemplateDetail = (templateId: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [template, setTemplate] = useState<LegalTemplateDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        if (!templateId) return;
        setIsLoading(true);
        const data = await fetchTemplateById({ userId: id, userType: role, templateId });
        if (data && data.data) {
            const t = data.data;
            setTemplate({
                id: String(t.id),
                title: t.title,
                description: t.description,
                timeEstimate: t.timeEstimate,
                category: t.category,
                iconKey: t.iconKey,
                documentUrl: t.documentUrl,
                html: t.html ?? null,
            });
        }
        setIsLoading(false);
    }, [id, role, templateId]);

    useEffect(() => {
        load();
    }, [load]);

    return { template, isLoading };
};

export default useTemplateDetail;
