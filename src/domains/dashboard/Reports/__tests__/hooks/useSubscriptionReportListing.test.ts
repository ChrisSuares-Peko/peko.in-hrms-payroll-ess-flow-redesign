import { renderHook, act } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { getSubscriptionFileBufferReport } from '../../api/index';
import useSubscriptionReportListing from '../../hooks/useSubscriptionReportListing';

// Mock API response
const mockFileBufferData = {
    buffer: { data: [37, 80, 68, 70] }, // Mocked file binary data
    fileType: 'application/pdf',
};

// Mock the API call
vi.mock('../../api/index', () => ({
    getSubscriptionFileBufferReport: vi.fn(),
}));

// Mock useAppSelector to return user auth data
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

// Mock file-saver
vi.mock('file-saver', () => ({
    saveAs: vi.fn(),
}));

describe('useSubscriptionReportListing Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('downloads report successfully as PDF', async () => {
        (useAppSelector as any).mockReturnValue({ role: 'admin', id: 1 });
        (getSubscriptionFileBufferReport as any).mockResolvedValue(mockFileBufferData);

        const { result } = renderHook(() =>
            useSubscriptionReportListing(
                {
                    page: 1,
                    searchText: '',
                    category: '',
                    sort: '',
                    itemsPerPage: 0,
                    filter: '',
                    from: '',
                    to: '',
                    sortField: '',
                },
                'Test Report'
            )
        );

        expect(result.current.isLoading).toBe(false);

        await act(async () => {
            await result.current.downloadReport('pdf');
        });

        expect(getSubscriptionFileBufferReport).toHaveBeenCalledWith({
            userId: 1,
            userType: 'admin',
            type: 'pdf',
            title: 'Test Report',
            page: 1,
            category: '',
            filter: '',
            from: '',
            itemsPerPage: 0,
            searchText: '',
            to: '',
            sortField: '',
            sort: '',
        });

        expect(saveAs).toHaveBeenCalledWith(
            expect.any(Blob),
            'Subscription Transactions Report.pdf'
        );
        expect(result.current.isLoading).toBe(false);
    });

    it('handles API failure gracefully', async () => {
        (getSubscriptionFileBufferReport as any).mockResolvedValue(false);

        const { result } = renderHook(() =>
            useSubscriptionReportListing(
                {
                    page: 1,
                    searchText: '',
                    category: '',
                    sort: '',
                    itemsPerPage: 0,
                    filter: '',
                    from: '',
                    to: '',
                    sortField: '',
                },
                'Test Report'
            )
        );

        await act(async () => {
            await result.current.downloadReport('pdf');
        });

        expect(getSubscriptionFileBufferReport).toHaveBeenCalled();
        expect(saveAs).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });
});
