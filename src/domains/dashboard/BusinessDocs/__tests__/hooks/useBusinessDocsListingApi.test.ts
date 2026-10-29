import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { categoryListing } from '@src/domains/dashboard/BusinessDocs/api';
import { useBusinessDocsListingApi } from '@src/domains/dashboard/BusinessDocs/hooks/useGetDocsListApI';
import { ICategoryListingResponse } from '@src/domains/dashboard/BusinessDocs/types/type';
import { useAppSelector } from '@src/hooks/store';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@src/domains/dashboard/BusinessDocs/api', () => ({
    categoryListing: vi.fn(),
}));

describe('useBusinessDocsListingApi', () => {
    const mockUseAppSelector = useAppSelector as any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAppSelector.mockReturnValue({ role: 'user', id: 1 });
    });

    it('should fetch and set category listing data successfully', async () => {
        const mockResponse: ICategoryListingResponse = {
            documents: [
                { id: 1, documentName: 'Doc 1', description: 'Description 1', documentUrl: 'url1' },
                { id: 2, documentName: 'Doc 2', description: 'Description 2', documentUrl: 'url2' },
            ],
            totalCount: 2,
        };

        (categoryListing as any).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() =>
            useBusinessDocsListingApi('searchKey', 'category', 1, 10, 'documentName', 'ASC')
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(categoryListing).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            searchKey: 'searchKey',
            category: 'category',
            page: 1,
            pageSize: 10,
            sortBy: 'documentName',
            sortType: 'ASC',
        });

        expect(result.current.data).toEqual([
            { title: 'Doc 1', documentUrl: 'url1' },
            { title: 'Doc 2', documentUrl: 'url2' },
        ]);
        expect(result.current.count).toBe(2);
    });

    it('should handle API failure and set loading to false', async () => {
        (categoryListing as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() =>
            useBusinessDocsListingApi('searchKey', 'category', 1, 10, 'documentName', 'ASC')
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(categoryListing).toHaveBeenCalledWith({
            userId: 1,
            userType: 'user',
            searchKey: 'searchKey',
            category: 'category',
            page: 1,
            pageSize: 10,
            sortBy: 'documentName',
            sortType: 'ASC',
        });

        expect(result.current.data).toEqual([]);
        expect(result.current.count).toBeUndefined();
    });

    it('should set loading state correctly during API call', async () => {
        (categoryListing as any).mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve(true), 100))
        );
        const { result } = renderHook(() =>
            useBusinessDocsListingApi('searchKey', 'category', 1, 10, 'documentName', 'ASC')
        );

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });
});
