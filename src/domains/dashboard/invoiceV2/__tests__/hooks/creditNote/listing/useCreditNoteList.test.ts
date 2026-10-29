import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAllCreditNotesApi, getCreditNoteDashboardApi } from '../../../../api/invoices';
import useCreditNoteList from '../../../../hooks/creditNote/listing/useCreditNoteList';

vi.mock('../../../../api/invoices', () => ({
    getAllCreditNotesApi: vi.fn(),
    getCreditNoteDashboardApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
}));

vi.mock('../../../../hooks/useDebounceSearch', () => ({
    default: vi.fn(() => ({ search: '', updateSearchText: vi.fn() })),
}));

vi.mock('../../../../utils/helperFunctions', () => ({
    getLastMonthDateRange: vi.fn(() => ({ startDate: '2026-06-01', endDate: '2026-06-30' })),
}));

vi.mock('@src/routes/paths', () => ({
    paths: { invoice: { index: 'invoice' } },
}));

const mockCreditNotes = { creditNotes: [], recordsTotal: 0 };
const mockDashboard = { totalCreditNotes: 5, totalValue: '10000.00' };

describe('useCreditNoteList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches list and dashboard on mount', async () => {
        (getAllCreditNotesApi as Mock).mockResolvedValue(mockCreditNotes);
        (getCreditNoteDashboardApi as Mock).mockResolvedValue(mockDashboard);

        const { result } = renderHook(() => useCreditNoteList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAllCreditNotesApi).toHaveBeenCalled();
        expect(getCreditNoteDashboardApi).toHaveBeenCalled();
    });

    it('isLoading becomes false after fetch', async () => {
        (getAllCreditNotesApi as Mock).mockResolvedValue(mockCreditNotes);
        (getCreditNoteDashboardApi as Mock).mockResolvedValue(mockDashboard);

        const { result } = renderHook(() => useCreditNoteList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isLoading).toBe(false);
    });

    it('dashboard is set correctly (totalCreditNotes=5)', async () => {
        (getAllCreditNotesApi as Mock).mockResolvedValue(mockCreditNotes);
        (getCreditNoteDashboardApi as Mock).mockResolvedValue(mockDashboard);

        const { result } = renderHook(() => useCreditNoteList());

        await waitFor(() => expect(result.current.isDashboardLoading).toBe(false));
        expect(result.current.dashboard?.totalCreditNotes).toBe(5);
    });

    it('creditNotes null when api returns null', async () => {
        (getAllCreditNotesApi as Mock).mockResolvedValue(null);
        (getCreditNoteDashboardApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useCreditNoteList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.creditNotes).toBeNull();
    });
});
