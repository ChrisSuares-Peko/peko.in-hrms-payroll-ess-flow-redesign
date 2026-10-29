import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCardAudit } from '../../api/admin/cardLimitsApi';
import { CardAuditCategory, CardAuditEvent } from '../../utils/types';

const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return `${date} ${time}`;
};

const VALID_CATEGORIES: CardAuditCategory[] = ['Lifecycle', 'Limits', 'Controls', 'Security'];

const toCategory = (raw: string): CardAuditCategory =>
    VALID_CATEGORIES.includes(raw as CardAuditCategory) ? (raw as CardAuditCategory) : 'Lifecycle';

export const useAuditTrailApi = (cardIssuanceId: string | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [events, setEvents] = useState<CardAuditEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAudit = useCallback(async () => {
        if (!cardIssuanceId) return;
        setIsLoading(true);
        const res = await getCardAudit(role, id, cardIssuanceId);
        if (res && res.data?.rows?.length) {
            setEvents(
                res.data.rows.map(item => ({
                    key: String(item.id),
                    title: item.title,
                    description: item.description,
                    timestamp: formatTimestamp(item.timestamp),
                    actor: item.actor,
                    category: toCategory(item.category),
                }))
            );
        } else {
            setEvents([]);
        }
        setIsLoading(false);
    }, [role, id, cardIssuanceId]);

    useEffect(() => {
        fetchAudit();
    }, [fetchAudit]);

    return { events, isLoading };
};
