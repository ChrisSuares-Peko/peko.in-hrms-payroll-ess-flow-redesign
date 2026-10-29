import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getCardLimitCards } from '../../../api/admin/cardLimitsApi';
import { useAdminCardsApi } from '../../../hooks/admin/useAdminCardsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/admin/cardLimitsApi', () => ({
    getCardLimitCards: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 1 } } };

const makeApiRow = (overrides = {}) => ({
    id: 101,
    last4: '5678',
    holder: 'Alice Adams',
    department: 'Engineering',
    type: 'Virtual',
    status: 'Active',
    cardState: 'ACTIVE',
    cardLimit: 100000,
    perTxnLimit: 10000,
    limitFrequency: 'Monthly',
    atmEnabled: false,
    restrictedCategories: [],
    spent: 25000,
    remaining: 75000,
    ...overrides,
});

describe('useAdminCardsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=true and cards=[], total=0', () => {
        (getCardLimitCards as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        expect(result.current.isLoading).toBe(true);
        expect(result.current.cards).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('maps rows and sets cards, total, isLoading=false on success', async () => {
        const row = makeApiRow();
        (getCardLimitCards as Mock).mockResolvedValue({ data: { rows: [row], count: 1 } });

        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toHaveLength(1);
        expect(result.current.total).toBe(1);

        const card = result.current.cards[0];
        expect(card.key).toBe('101');
        expect(card.last4).toBe('5678');
        expect(card.holder).toBe('Alice Adams');
        expect(card.department).toBe('Engineering');
        expect(card.spent).toBe(25000);
        expect(card.remaining).toBe(75000);
    });

    it('computes avatarText from first two words of holder name', async () => {
        (getCardLimitCards as Mock).mockResolvedValue({
            data: { rows: [makeApiRow({ holder: 'Bob Baker' })], count: 1 },
        });
        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.cards[0].avatarText).toBe('BB');
    });

    it('uses "-" for department when it is null', async () => {
        (getCardLimitCards as Mock).mockResolvedValue({
            data: { rows: [makeApiRow({ department: null })], count: 1 },
        });
        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.cards[0].department).toBe('-');
    });

    it('sets cards=[] and total=0 when API returns false', async () => {
        (getCardLimitCards as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.cards).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('sets cards=[] when rows array is empty', async () => {
        (getCardLimitCards as Mock).mockResolvedValue({ data: { rows: [], count: 0 } });
        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.cards).toEqual([]);
    });

    it('calls getCardLimitCards with role, id, page, pageSize, type, search, status, cardholder', async () => {
        (getCardLimitCards as Mock).mockResolvedValue(false);
        renderHook(() => useAdminCardsApi(2, 20, 'Virtual', 'Alice', 'Active', '101'));
        await waitFor(() =>
            expect(getCardLimitCards).toHaveBeenCalledWith(
                'admin',
                1,
                2,
                20,
                'Virtual',
                'Alice',
                'Active',
                '101'
            )
        );
    });

    it('refetch re-calls getCardLimitCards and updates cards', async () => {
        const row1 = makeApiRow({ id: 1 });
        const row2 = makeApiRow({ id: 2 });
        (getCardLimitCards as Mock)
            .mockResolvedValueOnce({ data: { rows: [row1], count: 1 } })
            .mockResolvedValueOnce({ data: { rows: [row1, row2], count: 2 } });

        const { result } = renderHook(() => useAdminCardsApi(1, 10));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.cards).toHaveLength(1);

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.cards).toHaveLength(2);
    });
});
