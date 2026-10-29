import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { generateIrnApi } from '../../../api/eInvoice';
import useGenerateIrn from '../../../hooks/generateIrn/useGenerateIrn';

vi.mock('../../../api/eInvoice', () => ({
    generateIrnApi: vi.fn(),
}));

vi.mock('../../../utils/generateIrnCalculations', () => ({
    calcTaxable: () => 100,
    calcIgst: () => 18,
    calcCgst: () => 9,
    calcTotal: () => 118,
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'admin' })),
}));

const makeFormState = (overrides: Partial<any> = {}) => ({
    invoiceId: '',
    transaction: {
        supplyType: 'B2B',
        documentType: 'INV',
        documentNumber: '001',
        documentPrefix: 'INV',
        documentDate: '2026-05-01',
        reverseCharge: false,
        igstOnIntra: false,
    },
    seller: {
        sellerGstin: 'GSTIN1',
        legalName: 'Seller',
        tradeName: 'Seller',
        address1: 'A1',
        location: 'Loc',
        pinCode: '560001',
        state: '29',
    },
    buyer: {
        customerId: '',
        buyerGstin: 'GSTIN2',
        legalName: 'Buyer',
        tradeName: 'Buyer',
        phoneNumber: '9999999999',
        address1: 'A2',
        location: 'Loc',
        pinCode: '560002',
        state: '29',
        placeOfSupply: '29',
    },
    items: {
        items: [
            {
                id: 'i-1',
                description: 'Item',
                hsnSac: '1234',
                quantity: 1,
                unit: 'NOS',
                unitPrice: 100,
                discount: 0,
                gstRate: 18,
            },
        ],
    },
    ...overrides,
});

describe('useGenerateIrn', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('builds intra-state payload with CGST/SGST and submits successfully', async () => {
        (generateIrnApi as Mock).mockResolvedValue({ status: true, message: 'ok' });
        const { result } = renderHook(() => useGenerateIrn());

        await act(async () => {
            await result.current.submitIrn(makeFormState());
        });

        const call = (generateIrnApi as Mock).mock.calls[0][0];
        expect(call.body.lineItems[0].cgstAmount).toBe(9);
        expect(call.body.lineItems[0].sgstAmount).toBe(9);
        expect(call.body.totalCgst).toBe(9);
        expect(call.body.totalSgst).toBe(9);
        expect(call.body.docDate).toBe('01/05/2026');
        expect(navigateMock).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'ok', variant: 'success' })
        );
    });

    it('uses IGST when igstOnIntra is true', async () => {
        (generateIrnApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useGenerateIrn());

        await act(async () => {
            await result.current.submitIrn(
                makeFormState({
                    transaction: {
                        supplyType: 'B2B',
                        documentType: 'INV',
                        documentNumber: '001',
                        documentPrefix: 'INV',
                        documentDate: '2026-05-01',
                        reverseCharge: false,
                        igstOnIntra: true,
                    },
                })
            );
        });

        const call = (generateIrnApi as Mock).mock.calls[0][0];
        expect(call.body.totalIgst).toBe(18);
        expect(call.body.totalCgst).toBeUndefined();
    });

    it('includes invoiceId in payload when provided', async () => {
        (generateIrnApi as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useGenerateIrn());

        await act(async () => {
            await result.current.submitIrn(makeFormState({ invoiceId: '42' }));
        });

        const call = (generateIrnApi as Mock).mock.calls[0][0];
        expect(call.body.invoiceId).toBe(42);
    });

    it('shows error toast when api fails', async () => {
        (generateIrnApi as Mock).mockResolvedValue({ status: false, message: 'nope' });
        const { result } = renderHook(() => useGenerateIrn());

        await act(async () => {
            await result.current.submitIrn(makeFormState());
        });

        expect(navigateMock).not.toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'nope', variant: 'error' })
        );
    });
});
