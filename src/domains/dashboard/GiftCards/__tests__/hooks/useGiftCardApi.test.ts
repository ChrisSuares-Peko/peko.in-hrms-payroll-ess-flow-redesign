import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getGiftcards } from '../../api/index';
import useGiftcardApi from '../../hooks/useGiftcardApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));
vi.mock('../../api/index', () => ({
    getGiftcards: vi.fn(),
}));

describe('useGiftcardApi Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as Mock).mockReturnValue({ role: 'admin', id: '123' });
    });

    it('should call getGiftcards API with correct parameters', async () => {
        const mockResponse = {
            count: 1,
            rows: [
                {
                    id: 'giftcard-001',
                    product_name: 'Amazon Gift Card',
                    description: 'Amazon',
                    image: 'amazon-logo.png',
                },
            ],
        };

        (getGiftcards as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useGiftcardApi('amazon', 1, 10, 'electronics', 0));

        await act(async () => {});

        expect(getGiftcards).toHaveBeenCalledWith({
            userId: '123',
            userType: 'admin',
            accessKeys: ['xoxoday', 'gift-card'],
            searchText: 'amazon',
            limit: 10,
            page: 1,
            category: 'electronics',
            offset: 0,
        });

        expect(result.current.data).toEqual([
            {
                name: 'Amazon Gift Card',
                description: 'Amazon',
                image: 'amazon-logo.png',
                id: 'giftcard-001',
                serviceOperator: '',
            },
        ]);

        expect(result.current.count).toBe(1);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle API failure gracefully', async () => {
        (getGiftcards as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useGiftcardApi('', 1, 10, '', 0));

        await act(async () => {});

        expect(result.current.data).toEqual([]);
        expect(result.current.count).toBe(0);
        expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state correctly during API call', async () => {
        let resolveFn: (value: any) => void;
        const mockPromise = new Promise(resolve => {
            resolveFn = resolve;
        });

        (getGiftcards as Mock).mockReturnValue(mockPromise);

        const { result } = renderHook(() => useGiftcardApi('', 1, 10, '', 0));

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            resolveFn({ rows: [] });
        });

        expect(result.current.isLoading).toBe(false);
    });

    it('should update when searchText, page, limit, category, or offset changes', async () => {
        const { rerender } = renderHook(
            ({ searchText, page, limit, category, offset }) =>
                useGiftcardApi(searchText, page, limit, category, offset),
            {
                initialProps: { searchText: '', page: 1, limit: 10, category: '', offset: 0 },
            }
        );

        await act(async () => {});

        rerender({ searchText: 'new search', page: 2, limit: 20, category: 'books', offset: 5 });

        await act(async () => {});

        expect(getGiftcards).toHaveBeenCalledTimes(2);
    });
});
