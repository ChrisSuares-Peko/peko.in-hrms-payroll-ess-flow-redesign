import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import {
    getCorporateCardApplications,
    getCorporateCardApplicationsSummary,
} from '../../api/corporateCardApplications';
import useCorporateCardApplications from '../../hooks/useCorporateCardApplications';
import { ApplicationsListPayload } from '../../types/corporateCardApplications';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('../../api/corporateCardApplications', () => ({
    getCorporateCardApplications: vi.fn(),
    getCorporateCardApplicationsSummary: vi.fn(),
}));

const mockAuth = { reducer: { auth: { role: 'admin', id: 5 } } };
const baseFilters: ApplicationsListPayload = {
    page: 1,
    itemsPerPage: 10,
    searchText: '',
    status: '',
};

describe('useCorporateCardApplications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
    });

    it('starts with isLoading=true and fetches both the list and the summary on mount', async () => {
        (getCorporateCardApplications as Mock).mockResolvedValue({ data: [], recordsTotal: 0 });
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useCorporateCardApplications(baseFilters));

        expect(result.current.isLoading).toBe(true);
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getCorporateCardApplications).toHaveBeenCalledWith({
            userId: 5,
            userType: 'admin',
            ...baseFilters,
        });
        expect(getCorporateCardApplicationsSummary).toHaveBeenCalledWith('admin', 5);
    });

    it('sets tableData and count from a successful list response', async () => {
        const rows = [{ corporateId: 42, companyName: 'Steel & Co' }];
        (getCorporateCardApplications as Mock).mockResolvedValue({ data: rows, recordsTotal: 1 });
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useCorporateCardApplications(baseFilters));

        await waitFor(() => expect(result.current.tableData).toEqual(rows));
        expect(result.current.count).toBe(1);
    });

    it('leaves tableData/count at their defaults when the list request fails', async () => {
        (getCorporateCardApplications as Mock).mockResolvedValue(false);
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useCorporateCardApplications(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.tableData).toEqual([]);
        expect(result.current.count).toBe(0);
    });

    it('sets summary from a successful summary response', async () => {
        const summary = {
            totalCorporates: 790,
            totalApplications: 2,
            pending: 1,
            completed: 0,
            notProvisioned: 788,
        };
        (getCorporateCardApplications as Mock).mockResolvedValue({ data: [], recordsTotal: 0 });
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(summary);

        const { result } = renderHook(() => useCorporateCardApplications(baseFilters));

        await waitFor(() => expect(result.current.summary).toEqual(summary));
    });

    it('leaves summary as null when the summary request fails', async () => {
        (getCorporateCardApplications as Mock).mockResolvedValue({ data: [], recordsTotal: 0 });
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(false);

        const { result } = renderHook(() => useCorporateCardApplications(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.summary).toBeNull();
    });

    it('refetch() re-invokes both the list and the summary fetch', async () => {
        (getCorporateCardApplications as Mock).mockResolvedValue({ data: [], recordsTotal: 0 });
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useCorporateCardApplications(baseFilters));
        await waitFor(() => expect(getCorporateCardApplications).toHaveBeenCalledTimes(1));

        result.current.refetch();

        await waitFor(() => expect(getCorporateCardApplications).toHaveBeenCalledTimes(2));
        expect(getCorporateCardApplicationsSummary).toHaveBeenCalledTimes(2);
    });

    it('re-fetches the list when a filter (e.g. status) changes, without re-fetching the summary', async () => {
        (getCorporateCardApplications as Mock).mockResolvedValue({ data: [], recordsTotal: 0 });
        (getCorporateCardApplicationsSummary as Mock).mockResolvedValue(null);

        const { rerender } = renderHook(
            (filters: ApplicationsListPayload) => useCorporateCardApplications(filters),
            {
                initialProps: baseFilters,
            }
        );
        await waitFor(() => expect(getCorporateCardApplications).toHaveBeenCalledTimes(1));

        rerender({ ...baseFilters, status: 'REJECTED' });

        await waitFor(() => expect(getCorporateCardApplications).toHaveBeenCalledTimes(2));
        expect(getCorporateCardApplications).toHaveBeenLastCalledWith({
            userId: 5,
            userType: 'admin',
            ...baseFilters,
            status: 'REJECTED',
        });
        expect(getCorporateCardApplicationsSummary).toHaveBeenCalledTimes(1);
    });
});
