import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAllCards } from '../../api/admin/cardLimitsApi';
import { CardRecord } from '../../utils/types';

const initials = (name: string) =>
    name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase();

/**
 * Fetches all cards in the org without pagination — for admin dropdown population only.
 * `enabled` gates the fetch: pass `false` on non-admin (cardholder) views so this admin-scoped
 * lookup is never called for a subcorporate session.
 */
export const useAllAdminCardsApi = (enabled = true) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [cards, setCards] = useState<CardRecord[]>([]);
    const [isLoading, setIsLoading] = useState(enabled);

    useEffect(() => {
        if (!enabled) {
            setCards([]);
            setIsLoading(false);
            return undefined;
        }
        let cancelled = false;
        const fetch = async () => {
            setIsLoading(true);
            const res = await getAllCards(role, id);
            if (!cancelled) {
                if (res && res.data?.rows?.length) {
                    const seen = new Set<string>();
                    setCards(
                        res.data.rows
                            .filter(r => {
                                const cardKey = r.maskedCardNumber ?? r.last4;
                                if (!cardKey || seen.has(cardKey)) return false;
                                seen.add(cardKey);
                                return true;
                            })
                            .map(r => ({
                                key: String(r.id),
                                last4: r.last4,
                                maskedCardNumber: r.maskedCardNumber,
                                holder: r.holder,
                                department: r.department ?? '-',
                                avatarText: initials(r.holder),
                                type: r.type as CardRecord['type'],
                                status: r.status as CardRecord['status'],
                                cardState: r.cardState,
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
                }
                setIsLoading(false);
            }
        };
        fetch();
        return () => {
            cancelled = true;
        };
    }, [role, id, enabled]);

    return { cards, isLoading };
};
