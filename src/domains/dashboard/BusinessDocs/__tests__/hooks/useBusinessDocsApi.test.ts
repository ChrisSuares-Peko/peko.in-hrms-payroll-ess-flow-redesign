import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { getBusinessDocs } from '@src/domains/dashboard/BusinessDocs/api';
import { useBusinessDocsApi } from '@src/domains/dashboard/BusinessDocs/hooks/useBusinessDocsApi';
import { ICategoryResponse } from '@src/domains/dashboard/BusinessDocs/types/type';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/domains/dashboard/BusinessDocs/api', () => ({
    getBusinessDocs: vi.fn(),
}));

describe('useBusinessDocsApi', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: 1 });
    });

    it('should fetch and set business docs category data successfully', async () => {
        const mockResponse: ICategoryResponse = {
            categoryDataWithCounts: [
                { id: 1, categoryName: 'Category 1', categoryImage: 'icon1.png', documentCount: 5 },
                {
                    id: 2,
                    categoryName: 'Category 2',
                    categoryImage: 'icon2.png',
                    documentCount: 10,
                },
            ],
        };

        (getBusinessDocs as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useBusinessDocsApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getBusinessDocs).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
        });

        expect(result.current.data).toEqual([
            { icon: 'icon1.png', category: 'Category 1', size: 5 },
            { icon: 'icon2.png', category: 'Category 2', size: 10 },
        ]);
    });

    it('should handle API failure and set loading to false', async () => {
        (getBusinessDocs as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useBusinessDocsApi());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(getBusinessDocs).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
        });

        expect(result.current.data).toEqual([]);
    });

    it('should set loading state correctly during API call', async () => {
        (getBusinessDocs as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );

        const { result } = renderHook(() => useBusinessDocsApi());

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });
});
