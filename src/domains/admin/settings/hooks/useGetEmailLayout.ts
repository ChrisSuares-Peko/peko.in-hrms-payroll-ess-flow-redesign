import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmailLayout } from '../api/emailLayouts';
import { EmailLayout } from '../types/emailLayout';

export default function useGetEmailLayout(id: number | undefined) {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [layout, setLayout] = useState<EmailLayout>();
    const [isLoading, setIsLoading] = useState(Boolean(id));
    const [loadFailed, setLoadFailed] = useState(false);

    const fetchLayout = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setLoadFailed(false);
        const response = await getEmailLayout({ userId, userType: role, id });
        if (response) {
            setLayout(response);
        } else {
            setLoadFailed(true);
        }
        setIsLoading(false);
    }, [id, userId, role]);

    useEffect(() => {
        fetchLayout();
    }, [fetchLayout]);

    return { layout, setLayout, isLoading, loadFailed, refetch: fetchLayout };
}
