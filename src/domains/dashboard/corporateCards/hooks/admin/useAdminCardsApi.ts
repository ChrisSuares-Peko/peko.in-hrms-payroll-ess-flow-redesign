import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCardLimitCards } from '../../api/admin/cardLimitsApi';
import { CardRecord } from '../../utils/types';

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

export const useAdminCardsApi = (
    page: number,
    pageSize: number,
    type?: string,
    search?: string,
    status?: string,
    holderId?: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [cards, setCards] = useState<CardRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCards = useCallback(async () => {
        setIsLoading(true);
        const res = await getCardLimitCards(
            role,
            id,
            page,
            pageSize,
            type,
            search,
            status,
            holderId
        );
        if (res && res.data?.rows?.length) {
            setTotal(res.data.count);
            setCards(
                res.data.rows.map(r => ({
                    key: String(r.id),
                    holderId: r.holderId,
                    last4: r.last4,
                    maskedCardNumber: r.maskedCardNumber,
                    holder: r.holder,
                    nameOnCard: r.nameOnCard,
                    department: r.department ?? '-',
                    avatarText: initials(r.holder || r.nameOnCard || ''),
                    type: r.type as CardRecord['type'],
                    status: r.status as CardRecord['status'],
                    cardState: r.cardState,
                    terminationStatus: r.terminationStatus,
                    frozenByRole: r.frozenByRole ?? null,
                    freezeReasonLabel: r.freezeReasonLabel ?? null,
                    freezeReasonNote: r.freezeReasonNote ?? null,
                    cardLimit: r.cardLimit,
                    perTxnLimit: r.perTxnLimit,
                    limitFrequency: r.limitFrequency,
                    atmEnabled: r.atmEnabled,
                    restrictedCategories: r.restrictedCategories,
                    spent: r.spent,
                    remaining: r.remaining,
                }))
            );
        } else {
            setCards([]);
            setTotal(0);
        }
        setIsLoading(false);
    }, [role, id, page, pageSize, type, search, status, holderId]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    return { cards, total, isLoading, refetch: fetchCards };
};
