import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceAllApi } from '../../api/eInvoice';
import useEInvoiceRegister from '../../hooks/useEInvoiceRegister';

vi.mock('../../api/eInvoice', () => ({
    getEInvoiceAllApi: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const baseFilters = {
    page: 1,
    itemsPerPage: 10,
    sort: 'DESC' as const,
    sortField: 'createdAt',
    from: '',
    to: '',
    searchText: '',
    status: '',
    supplyType: '',
};

const row = {
    id: 1,
    docDate: '2026-05-01',
    prefix: 'INV',
    docNo: '001',
    buyerDetails: { legalName: 'Buyer', gstin: 'g' },
    irn: 'hash',
    ackNo: 'ack-1',
    supplyType: 'B2B',
    totalAmount: 1000,
    totalTaxableValue: 800,
    status: 'ACTIVE' as const,
    eWaybillId: 'ewb-1',
};

describe('useEInvoiceRegister', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and maps register rows + stats', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [row],
            recordsTotal: 1,
            activeCount: 5,
            cancelledCount: 2,
        });

        const { result } = renderHook(() => useEInvoiceRegister(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows[0]).toMatchObject({
            document: 'INV001',
            buyerName: 'Buyer',
            irnHash: 'hash',
            irnAck: 'ACK: ack-1',
            ewb: 'ewb-1',
            status: 'Active',
        });
        expect(result.current.stats).toEqual({
            total: 7,
            active: 5,
            cancelled: 2,
            activeValue: '',
        });
        expect(result.current.recordsTotal).toBe(1);
    });

    it('renders --- ewb when no e-waybill id', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [{ ...row, eWaybillId: null }],
            recordsTotal: 1,
            activeCount: 1,
            cancelledCount: 0,
        });
        const { result } = renderHook(() => useEInvoiceRegister(baseFilters));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows[0].ewb).toBe('---');
    });

    it('forwards search/status/supplyType filters when present', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue({
            eInvoices: [],
            recordsTotal: 0,
            activeCount: 0,
            cancelledCount: 0,
        });
        renderHook(() =>
            useEInvoiceRegister({
                ...baseFilters,
                searchText: '  inv  ',
                status: 'ACTIVE',
                supplyType: 'B2B',
            })
        );
        await waitFor(() =>
            expect(getEInvoiceAllApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        searchText: 'inv',
                        status: 'ACTIVE',
                        supplyType: 'B2B',
                    }),
                })
            )
        );
    });

    it('keeps initial rows/stats when api returns null', async () => {
        (getEInvoiceAllApi as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => useEInvoiceRegister(baseFilters));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.rows).toEqual([]);
        expect(result.current.stats.total).toBe(0);
    });
});
