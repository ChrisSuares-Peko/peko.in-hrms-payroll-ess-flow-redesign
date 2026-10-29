import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { getUserCards } from '../../../api/user/cardsApi';
import { useCardsApi } from '../../../hooks/user/useCardsApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/cardsApi', () => ({
    getUserCards: vi.fn(),
}));

const mockAuthState = {
    reducer: {
        auth: {
            role: 'user',
            id: 1,
            roleName: 'user',
            username: 'testuser',
            subCorporateId: null,
        },
    },
};

const makeCard = (overrides: Record<string, unknown> = {}) => ({
    id: 101,
    maskedCardNumber: '************1234',
    cardholder: { name: 'John Doe' },
    remaining: 50000,
    spent: 10000,
    cardLimit: 60000,
    type: 'Physical',
    cardState: 'ACTIVE',
    cardViewLink: 'https://example.com/card/101',
    ...overrides,
});

describe('useCardsApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuthState));
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
    });

    it('should have isLoading=true and cards=[] as initial state before fetch resolves', async () => {
        let resolveGetUserCards!: (value: any) => void;
        (getUserCards as Mock).mockReturnValueOnce(
            new Promise(resolve => {
                resolveGetUserCards = resolve;
            })
        );

        const { result } = renderHook(() => useCardsApi());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.cards).toEqual([]);

        await act(async () => {
            resolveGetUserCards(false);
        });
    });

    it('should map a single card correctly on a successful fetch', async () => {
        const raw = makeCard();
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [raw] },
        });

        const { result } = renderHook(() => useCardsApi());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toHaveLength(1);
        const card = result.current.cards[0];
        expect(card.key).toBe(String(raw.id));
        expect(card.holder).toBe('John Doe');
        expect(card.last4).toBe('1234');
        expect(card.used).toBe(10000);
        expect(card.limit).toBe(60000);
        expect(card.cardViewLink).toBe('https://example.com/card/101');
        expect(card.maskedCardNumber).toBe('************1234');
    });

    it('should map perTxnLimit from the API response onto the card', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ perTxnLimit: 1 })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].perTxnLimit).toBe(1);
    });

    it('should map cardState BLOCKED to status Frozen', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ cardState: 'BLOCKED' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].status).toBe('Frozen');
    });

    it('should map cardState FROZEN to status Frozen', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ cardState: 'FROZEN' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].status).toBe('Frozen');
    });

    it('should map cardState ACTIVE to status Active', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ cardState: 'ACTIVE' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].status).toBe('Active');
    });

    it('should map an unknown cardState to status Active', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ cardState: 'SOMETHING_ELSE' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].status).toBe('Active');
    });

    it('should map type Physical to kind "Physical Card"', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ type: 'Physical' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].kind).toBe('Physical Card');
    });

    it('should map type Virtual to kind "Virtual Card"', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ type: 'Virtual' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].kind).toBe('Virtual Card');
    });

    it('should map any non-Physical type to kind "Virtual Card"', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ type: 'Unknown' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].kind).toBe('Virtual Card');
    });

    it('should filter out cards that have no maskedCardNumber', async () => {
        const cardWithNumber = makeCard({ id: 1, maskedCardNumber: '************5678' });
        const cardWithoutNumber = makeCard({ id: 2, maskedCardNumber: '' });
        const cardNullNumber = { ...makeCard({ id: 3 }), maskedCardNumber: null };

        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [cardWithNumber, cardWithoutNumber, cardNullNumber] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toHaveLength(1);
        expect(result.current.cards[0].key).toBe('1');
    });

    it('should format balance with ₹ and en-IN locale', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ remaining: 150000 })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].balance).toBe(`₹${(150000).toLocaleString('en-IN')}`);
    });

    it('should format balance of zero correctly', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ remaining: 0 })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].balance).toBe(`₹${(0).toLocaleString('en-IN')}`);
    });

    it('should set isLoading=false and keep cards=[] when getUserCards returns false', async () => {
        (getUserCards as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toEqual([]);
    });

    it('should set isLoading=false and keep cards=[] when getUserCards returns null', async () => {
        (getUserCards as Mock).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toEqual([]);
    });

    it('should set isLoading=false and cards=[] when rows array is empty', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toEqual([]);
    });

    it('should set isLoading=false and cards=[] when data.rows is undefined', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({ data: {} });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toEqual([]);
    });

    it('should re-call getUserCards when refetch is invoked', async () => {
        const card1 = makeCard({ id: 1, maskedCardNumber: '************1111' });
        const card2 = makeCard({ id: 2, maskedCardNumber: '************2222' });

        (getUserCards as Mock)
            .mockResolvedValueOnce({ data: { rows: [card1] } })
            .mockResolvedValueOnce({ data: { rows: [card1, card2] } });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toHaveLength(1);

        await act(async () => {
            await result.current.refetch();
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards).toHaveLength(2);
        expect(getUserCards).toHaveBeenCalledTimes(2);
    });

    it('should call getUserCards with role and id taken from auth state', async () => {
        (getUserCards as Mock).mockResolvedValueOnce(false);

        renderHook(() => useCardsApi());

        await waitFor(() =>
            expect(getUserCards).toHaveBeenCalledWith(
                mockAuthState.reducer.auth.role,
                mockAuthState.reducer.auth.id
            )
        );
    });

    it('should set holder to empty string when cardholder is null', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ cardholder: null })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].holder).toBe('');
    });

    it('should extract exactly the last 4 characters as last4', async () => {
        (getUserCards as Mock).mockResolvedValueOnce({
            data: { rows: [makeCard({ maskedCardNumber: 'XXXX-XXXX-XXXX-9876' })] },
        });

        const { result } = renderHook(() => useCardsApi());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.cards[0].last4).toBe('9876');
    });
});
