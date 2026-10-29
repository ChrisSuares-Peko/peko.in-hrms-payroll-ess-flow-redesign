import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAllInvoices } from '../../../../api/invoices';
import useCreateCreditNote from '../../../../hooks/creditNote/create/useCreateCreditNote';

vi.mock('../../../../api/invoices', () => ({
    getAllInvoices: vi.fn(),
    getInvoiceById: vi.fn(),
    getNextCreditNoteNumberApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@src/routes/paths', () => ({
    paths: { invoice: { index: 'invoice', creditNoteCreate: 'credit-notes/create', creditNotePreview: 'credit-notes/preview' } },
}));

const mockInvoices = {
    invoiceData: [
        { id: '1', name: 'Customer A', invoiceNumber: '001', prefix: 'INV-', isCreditNoteCreated: false },
        { id: '2', name: 'Customer B', invoiceNumber: '002', prefix: 'INV-', isCreditNoteCreated: true },
    ],
    recordsTotal: 2,
};

describe('useCreateCreditNote', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches invoice options on mount and sets invoiceOptions', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);

        const { result } = renderHook(() => useCreateCreditNote());

        await waitFor(() => expect(result.current.loadingInvoices).toBe(false));
        expect(getAllInvoices).toHaveBeenCalled();
        expect(result.current.invoiceOptions.length).toBeGreaterThan(0);
    });

    it('filters out invoices where isCreditNoteCreated=true from options', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);

        const { result } = renderHook(() => useCreateCreditNote());

        await waitFor(() => expect(result.current.loadingInvoices).toBe(false));
        expect(result.current.invoiceOptions).toHaveLength(1);
        expect(result.current.invoiceOptions[0].id).toBe('1');
    });

    it('loadingInvoices starts true then becomes false after fetch', async () => {
        let resolve: (v: any) => void;
        (getAllInvoices as Mock).mockReturnValue(new Promise(r => { resolve = r; }));

        const { result } = renderHook(() => useCreateCreditNote());

        expect(result.current.loadingInvoices).toBe(true);

        resolve!(mockInvoices);

        await waitFor(() => expect(result.current.loadingInvoices).toBe(false));
    });

    it('cnLinkedInvoice is null initially when no invoiceId param', async () => {
        (getAllInvoices as Mock).mockResolvedValue(mockInvoices);

        const { result } = renderHook(() => useCreateCreditNote());

        expect(result.current.cnLinkedInvoice).toBeNull();
    });
});
