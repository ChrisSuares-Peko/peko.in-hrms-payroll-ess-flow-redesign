import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAllInvoices, getQuotationDashboardApi } from '../../../api/invoices';
import useQuotationList from '../../../hooks/quotation/useQuotationList';

vi.mock('../../../api/invoices', () => ({
    getAllInvoices: vi.fn(),
    deleteInvoiceApi: vi.fn(),
    getQuotationDashboardApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: unknown) => x),
}));

const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
}));

vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: vi.fn((_setter: unknown) => ({ searchText: '', updateSearchText: vi.fn() })),
}));

vi.mock('../../../utils/helperFunctions', () => ({
    getLastMonthDateRange: vi.fn(() => ({ startDate: '2026-06-01', endDate: '2026-06-30' })),
}));

const mockListResponse = { invoiceData: [], recordsTotal: 0 };
const mockDashboardResponse = { totalQuotations: 5, pending: 3, accepted: 2 };

describe('useQuotationList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches list and dashboard on mount', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockListResponse);
        (getQuotationDashboardApi as Mock).mockResolvedValue(mockDashboardResponse);

        renderHook(() => useQuotationList());

        await waitFor(() => {
            expect(getAllInvoices).toHaveBeenCalledTimes(1);
            expect(getQuotationDashboardApi).toHaveBeenCalledTimes(1);
        });
    });

    it('isLoading becomes false after fetch', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockListResponse);
        (getQuotationDashboardApi as Mock).mockResolvedValue(mockDashboardResponse);

        const { result } = renderHook(() => useQuotationList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });

    it('quotations set correctly from response', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockListResponse);
        (getQuotationDashboardApi as Mock).mockResolvedValue(mockDashboardResponse);

        const { result } = renderHook(() => useQuotationList());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.quotations).toEqual(mockListResponse);
    });

    it('returns null dashboard when api returns null', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockListResponse);
        (getQuotationDashboardApi as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useQuotationList());

        await waitFor(() => expect(result.current.isDashboardLoading).toBe(false));

        expect(result.current.dashboard).toBeNull();
    });
});
