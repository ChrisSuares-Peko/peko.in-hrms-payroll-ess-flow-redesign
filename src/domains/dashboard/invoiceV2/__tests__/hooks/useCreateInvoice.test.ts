import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import {
    createInvoice,
    getAllCustomersForSelect,
    getInvoiceById,
    getNextInvoiceNumberApi,
    updateInvoice,
} from '../../api/invoices';
import { getProfileCompanyApi } from '../../api/settings';
import useCreateInvoice from '../../hooks/useCreateInvoice';

vi.mock('../../api/invoices', () => ({
    createInvoice: vi.fn(),
    getAllCustomersForSelect: vi.fn(),
    getInvoiceById: vi.fn(),
    getNextInvoiceNumberApi: vi.fn(),
    updateInvoice: vi.fn(),
}));

vi.mock('../../api/settings', () => ({
    getProfileCompanyApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

const basePayload = {
    buyer: {
        customerId: undefined,
        name: 'Buyer',
        gstNumber: '',
        address: 'Addr',
        city: 'City',
        state: 'Karnataka',
        country: '',
        pincode: '560001',
        email: '',
        phoneNumber: '9999999999',
        saveCustomer: false,
    },
    invoice: {
        type: 'DOMESTIC' as const,
        invoicePrefix: 'INV-',
        invoiceNumber: '001',
        currency: 'INR',
        invoiceDate: '2024-01-01',
        dueDate: '2024-01-10',
    },
    items: [
        {
            name: 'Item',
            hsn: '',
            quantity: 1,
            unit: 'pcs',
            unitPrice: 100,
            discount: 0,
            taxRate: '18',
        },
    ],
    additional: {
        termsAndConditions: '',
        notes: '',
        shippingCost: '0',
        amountPaid: null,
        paymentMode: 'cash',
    },
};

describe('useCreateInvoice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getAllCustomersForSelect as Mock).mockResolvedValue([]);
        (getProfileCompanyApi as Mock).mockResolvedValue({ state: 'Karnataka' });
        (getNextInvoiceNumberApi as Mock).mockResolvedValue({ nextNumber: '100' });
        (getInvoiceById as Mock).mockResolvedValue(null);
    });

    it('should load initial data on mount (create mode)', async () => {
        const { result } = renderHook(() => useCreateInvoice());

        await waitFor(() => expect(result.current.isInitialLoading).toBeFalsy());
        expect(result.current.nextInvoiceNumber).toBe('100');
        expect(getNextInvoiceNumberApi).toHaveBeenCalled();
    });

    it('should show error toast when customer fetch fails', async () => {
        (getAllCustomersForSelect as Mock).mockResolvedValue(false);
        renderHook(() => useCreateInvoice());

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({
                    description: 'Something went wrong while fetching customers.',
                    variant: 'error',
                })
            )
        );
    });

    it('should populate editInitialValues when invoiceId is present and fetch succeeds', async () => {
        (getInvoiceById as Mock).mockResolvedValue({
            customerId: '5',
            name: 'Existing',
            gstNumber: '',
            address: 'A',
            city: 'C',
            state: 'S',
            country: '',
            pincode: '',
            email: '',
            phoneNumber: '',
            invoiceType: 'DOMESTIC',
            prefix: 'INV-',
            invoiceNumber: '200',
            currency: 'INR',
            invoiceDate: '2024-01-01',
            dueDate: '2024-01-10',
            items: [],
            termsAndConditions: '',
            notes: '',
            shippingCost: '0',
            amountPaid: null,
            paymentMode: 'cash',
        });

        const { result } = renderHook(() => useCreateInvoice('42'));

        await waitFor(() => expect(result.current.isInitialLoading).toBeFalsy());
        expect(result.current.editInitialValues?.buyer.name).toBe('Existing');
        expect(result.current.editInitialValues?.invoice.invoiceNumber).toBe('200');
    });

    it('should show error toast when invoice fetch fails in edit mode', async () => {
        (getInvoiceById as Mock).mockResolvedValue(false);
        renderHook(() => useCreateInvoice('42'));

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'Failed to load invoice.', variant: 'error' })
            )
        );
    });

    it('should call createInvoice when no invoiceId and fire onSuccess', async () => {
        (createInvoice as Mock).mockResolvedValue({ status: true, data: { id: '99' } });
        const { result } = renderHook(() => useCreateInvoice());
        await waitFor(() => expect(result.current.isInitialLoading).toBeFalsy());

        const onSuccess = vi.fn();
        await act(async () => {
            await result.current.handleInvoice(basePayload as any, true, onSuccess);
        });

        expect(createInvoice).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Invoice generated successfully', variant: 'success' })
        );
        expect(onSuccess).toHaveBeenCalledWith('99');
    });

    it('should call updateInvoice when invoiceId is present', async () => {
        (updateInvoice as Mock).mockResolvedValue({ status: true, data: { id: '42' } });
        const { result } = renderHook(() => useCreateInvoice('42'));
        await waitFor(() => expect(result.current.isInitialLoading).toBeFalsy());

        await act(async () => {
            await result.current.handleInvoice(basePayload as any, false);
        });

        expect(updateInvoice).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Invoice updated successfully', variant: 'success' })
        );
    });

    it('should show error toast when create API returns failure', async () => {
        (createInvoice as Mock).mockResolvedValue({ status: false, message: 'Invalid data' });
        const { result } = renderHook(() => useCreateInvoice());
        await waitFor(() => expect(result.current.isInitialLoading).toBeFalsy());

        await act(async () => {
            await result.current.handleInvoice(basePayload as any, false);
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Invalid data', variant: 'error' })
        );
    });
});
