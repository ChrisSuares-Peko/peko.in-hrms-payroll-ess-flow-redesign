import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAllInvoices } from '../../../api/invoices';
import { useMakeRecurring } from '../../../hooks/recurring/useMakeRecurring';

vi.mock('../../../api/invoices', () => ({ getAllInvoices: vi.fn() }));
vi.mock('../../../api/recurring', () => ({ createRecurringSchedule: vi.fn() }));

vi.mock('../../../utils/recurrenceEngine', () => ({
    computeNextRuns: vi.fn(() => []),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: unknown) => x),
}));

vi.mock('react-redux', () => ({
    useDispatch: () => vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

const baseProps = {
    open: false,
    onClose: vi.fn(),
    onCreated: vi.fn(),
};

describe('useMakeRecurring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches invoiceOptions on open=true when no sourceInvoice provided', async () => {
        (getAllInvoices as Mock).mockResolvedValue({ invoiceData: [], recordsTotal: 0 });

        renderHook(() => useMakeRecurring({ ...baseProps, open: true }));

        await waitFor(() => {
            expect(getAllInvoices).toHaveBeenCalledTimes(1);
        });
    });

    it('does NOT call getAllInvoices when sourceInvoice is provided', async () => {
        const sourceInvoice = { id: 'inv-1', name: 'Test Invoice' } as any;

        renderHook(() => useMakeRecurring({ ...baseProps, open: true, sourceInvoice }));

        await new Promise(r => setTimeout(r, 50));

        expect(getAllInvoices).not.toHaveBeenCalled();
    });

    it('isSaving is false initially', () => {
        const { result } = renderHook(() => useMakeRecurring(baseProps));

        expect(result.current.isSaving).toBe(false);
    });

    it('returns empty nextRuns array initially', () => {
        const { result } = renderHook(() => useMakeRecurring(baseProps));

        expect(result.current.nextRuns).toEqual([]);
    });
});
