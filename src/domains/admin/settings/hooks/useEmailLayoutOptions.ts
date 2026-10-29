import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmailLayouts } from '../api/emailLayouts';
import { EmailLayoutListItem, EmailLayoutType } from '../types/emailLayout';

// Unpaginated active-layouts fetch for dropdowns (unlike useGetEmailLayouts.ts's paginated table hook).
export default function useEmailLayoutOptions(type: EmailLayoutType) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [layouts, setLayouts] = useState<EmailLayoutListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getEmailLayouts({
            userId: id,
            userType: role,
            page: 1,
            itemsPerPage: 100,
            type,
            isActive: true,
        }).then(response => {
            if (cancelled) return;
            setLayouts(response ? response.rows : []);
            setIsLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [id, role, type]);

    return { layouts, isLoading };
}
