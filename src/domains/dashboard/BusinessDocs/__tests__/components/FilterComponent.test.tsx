import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import FilterComponent from '@src/domains/dashboard/BusinessDocs/components/FilterComponent';
import { useBusinessDocsListingApi } from '@src/domains/dashboard/BusinessDocs/hooks/useGetDocsListApI';
import useDebounce from '@src/hooks/useDebounce';

// Mock dependencies
vi.mock('@src/hooks/useDebounce', () => ({
    default: vi.fn(),
}));

vi.mock('@src/domains/dashboard/BusinessDocs/hooks/useGetDocsListApI', () => ({
    useBusinessDocsListingApi: vi.fn(),
}));

describe('FilterComponent', () => {
    const mockUseDebounce = useDebounce as any;
    const mockUseBusinessDocsListingApi = useBusinessDocsListingApi as any;
    const mockSetIsLoading = vi.fn();
    const mockDocsData = vi.fn();
    const mockSetCount = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseDebounce.mockImplementation((value: any) => value);
        mockUseBusinessDocsListingApi.mockReturnValue({
            data: [],
            count: 0,
            isLoading: false,
        });
    });

    it('renders input field with placeholder', () => {
        render(
            <FilterComponent
                category="test-category"
                docsData={mockDocsData}
                page={1}
                setcount={mockSetCount}
                pageSize={10}
                setIsloading={mockSetIsLoading}
            />
        );

        const input = screen.getByPlaceholderText('Search For Documents');
        expect(input).toBeInTheDocument();
    });

    it('calls useBusinessDocsListingApi with correct parameters and updates state on search', async () => {
        const mockData = [{ title: 'Doc 1', documentUrl: 'url1.pdf' }];
        const mockResponse = { data: mockData, count: 1, isLoading: false };

        mockUseBusinessDocsListingApi.mockReturnValue(mockResponse);

        render(
            <FilterComponent
                category="test-category"
                docsData={mockDocsData}
                page={1}
                setcount={mockSetCount}
                pageSize={10}
                setIsloading={mockSetIsLoading}
            />
        );

        const input = screen.getByPlaceholderText('Search For Documents');

        fireEvent.change(input, { target: { value: 'test search' } });

        await waitFor(() => {
            expect(mockUseBusinessDocsListingApi).toHaveBeenCalledWith(
                'test search',
                'test category',
                1,
                10,
                'createdAt',
                'DESC'
            );
        });

        expect(mockDocsData).toHaveBeenCalledWith(mockData);
        expect(mockSetCount).toHaveBeenCalledWith(1);
        expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    });

    it('clears the search input field', () => {
        render(
            <FilterComponent
                category="test-category"
                docsData={mockDocsData}
                page={1}
                setcount={mockSetCount}
                pageSize={10}
                setIsloading={mockSetIsLoading}
            />
        );

        const input = screen.getByPlaceholderText('Search For Documents');
        fireEvent.change(input, { target: { value: 'test search' } });
        expect(input).toHaveValue('test search');

        fireEvent.change(input, { target: { value: '' } });
        expect(input).toHaveValue('');
    });
});
