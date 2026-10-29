import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchAgingAnalysis } from '../../../api/aging';
import { useAgingAnalysis } from '../../../hooks/agingAnalysis/useAgingAnalysis';

vi.mock('../../../api/aging', () => ({ fetchAgingAnalysis: vi.fn() }));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

vi.mock('../../../utils/constants/agingAnalysis', () => ({
    AGING_BUCKET_CONFIG: {},
    AGING_BUCKET_LABEL_TO_KEY: {},
    AGING_FILTER_OPTIONS: [],
}));

const mockResponse = {
    summary: {
        outstanding: { amount: 5000, changePercentage: 10 },
        overdue: { amount: 1000, changePercentage: 5 },
        paid: { amount: 2000, changePercentage: 0 },
        avgDaysToPay: 15,
    },
    agingAnalysis: { buckets: [], totalPaid: 2000, totalOutstanding: 5000 },
    invoices: [],
    pagination: { totalRecords: 0 },
};

describe('useAgingAnalysis', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sets summary correctly after fetch', async () => {
        (fetchAgingAnalysis as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useAgingAnalysis());

        await waitFor(() => expect(result.current.isLoadingAgingAnalysis).toBe(false));

        expect(result.current.summary.outstanding).toBe(5000);
        expect(result.current.summary.overdue).toBe(1000);
        expect(result.current.summary.paid).toBe(2000);
        expect(result.current.summary.avgDaysToPay).toBe(15);
    });

    it('sets paidVsOutstanding correctly', async () => {
        (fetchAgingAnalysis as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useAgingAnalysis());

        await waitFor(() => expect(result.current.isLoadingAgingAnalysis).toBe(false));

        expect(result.current.paidVsOutstanding).toEqual({ paid: 2000, outstanding: 5000 });
    });

    it('totalRecords is 0 when invoices empty', async () => {
        (fetchAgingAnalysis as Mock).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useAgingAnalysis());

        await waitFor(() => expect(result.current.isLoadingAgingAnalysis).toBe(false));

        expect(result.current.totalRecords).toBe(0);
    });

    it('returns null paidVsOutstanding when api returns null', async () => {
        (fetchAgingAnalysis as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useAgingAnalysis());

        await waitFor(() => expect(result.current.isLoadingAgingAnalysis).toBe(false));

        expect(result.current.paidVsOutstanding).toBeNull();
    });
});
