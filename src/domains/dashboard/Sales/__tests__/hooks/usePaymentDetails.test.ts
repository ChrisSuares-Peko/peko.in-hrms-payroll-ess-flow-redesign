import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';

import { getPaymentTransactionDetails } from '../../api/payments';
import usePaymentDetails from '../../hooks/usePaymentDetails';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('../../api/payments', () => ({
    getPaymentTransactionDetails: vi.fn(),
    downloadPaymentReceiptApi: vi.fn(),
}));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('usePaymentDetails', () => {
    it('does nothing when transactionId is missing', async () => {
        const { result } = renderHook(() => usePaymentDetails(undefined));

        await waitFor(() => expect(getPaymentTransactionDetails).not.toHaveBeenCalled());
        expect(result.current.data).toBeNull();
    });

    it('maps API response into the PaymentDetailsData shape', async () => {
        (getPaymentTransactionDetails as any).mockResolvedValueOnce({
            paymentLink: {
                transactionId: 'TXN-1',
                dateTime: '2026-01-01',
                decentro_txn_id: 'DEC-1',
                status: 'SUCCESS',
                amount: '500.50',
                timeline: [{ id: 1 }],
            },
            invoice: {
                id: 'inv-1',
                invoiceNumber: 'INV-1',
                paymentMode: 'UPI',
                notes: 'note',
                name: 'Acme',
                phoneNumber: '999',
                email: 'a@b.com',
                gstNumber: 'GST',
                address: 'Line1\nLine2',
                city: 'KL',
                state: 'KL',
                pincode: '111111',
                country: 'IN',
                status: 'PAID',
            },
        });

        const { result } = renderHook(() => usePaymentDetails('TXN-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getPaymentTransactionDetails).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            transactionId: 'TXN-1',
        });
        expect(result.current.data).toMatchObject({
            transactionId: 'TXN-1',
            invoiceRef: 'INV-1',
            paymentMethod: 'UPI',
            transactionRef: 'DEC-1',
            status: 'SUCCESS',
            amount: 500.5,
            customerName: 'Acme',
            customerAddress: 'Line1\nLine2, KL, KL',
            invoiceId: 'inv-1',
            timeline: [{ id: 1 }],
        });
    });

    it('defaults timeline and amount when missing', async () => {
        (getPaymentTransactionDetails as any).mockResolvedValueOnce({
            paymentLink: {
                transactionId: 'TXN-1',
                dateTime: '',
                decentro_txn_id: '',
                status: 'PENDING',
                amount: 'NaN',
            },
            invoice: {
                id: 'inv-1',
                invoiceNumber: 'INV-1',
                paymentMode: 'CASH',
                notes: '',
                name: 'X',
                phoneNumber: '',
                email: '',
                gstNumber: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                country: '',
                status: '',
            },
        });

        const { result } = renderHook(() => usePaymentDetails('TXN-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data?.amount).toBe(0);
        expect(result.current.data?.timeline).toEqual([]);
        expect(result.current.data?.customerAddress).toBe('');
    });

    it('keeps data null when API returns falsy', async () => {
        (getPaymentTransactionDetails as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => usePaymentDetails('TXN-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toBeNull();
    });
});
