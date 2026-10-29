import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllAgreementsApi } from '../../../api/agreements';
import { AGREEMENT_STATUS_COUNTS_DEFAULT } from '../../../constants/agreement';
import useAgreementData from '../../../hooks/agreement/useAgreementData';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/agreements', () => ({
    getAllAgreementsApi: vi.fn(),
}));

const mockDispatch = vi.fn();

const baseFilters = {
    page: 1,
    itemsPerPage: 10,
    searchText: '',
    status: '',
    customerId: undefined,
    sortField: '',
    sort: 'DESC' as const,
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useAgreementData', () => {
    it('fetches agreements on mount and maps API rows', async () => {
        (getAllAgreementsApi as any).mockResolvedValueOnce({
            status: true,
            data: {
                agreements: [
                    {
                        id: 1,
                        prefix: 'AGR-',
                        agreementNumber: '001',
                        invoiceCustomerV2: { name: 'Acme' },
                        quotationId: 9,
                        quotation: { prefix: 'Q-', invoiceNumber: '5' },
                        startDate: '2026-01-15',
                        updatedAt: new Date().toISOString(),
                        status: 'DRAFT',
                        title: 'Lease',
                        contractType: 'service',
                        currency: 'INR',
                        paymentTerms: 'NET30',
                        documentUrl: 'https://example.com/doc.pdf',
                        description: 'desc',
                    },
                ],
                recordsTotal: 1,
                statusCounts: { ...AGREEMENT_STATUS_COUNTS_DEFAULT, draft: 1 },
            },
        });

        const { result } = renderHook(() => useAgreementData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAllAgreementsApi).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u', userType: 'merchant', page: 1 })
        );
        expect(result.current.agreements).toHaveLength(1);
        expect(result.current.agreements[0]).toMatchObject({
            id: '1',
            displayId: 'AGR-001',
            customer: 'Acme',
            quotationId: 9,
            quotationPrefix: 'Q-',
            quotationInvoiceNumber: '5',
            hasDocument: true,
        });
        expect(result.current.recordsTotal).toBe(1);
    });

    it('falls back to "-" customer when invoiceCustomerV2 missing', async () => {
        (getAllAgreementsApi as any).mockResolvedValueOnce({
            status: true,
            data: {
                agreements: [
                    {
                        id: 2,
                        agreementNumber: '002',
                        invoiceCustomerV2: null,
                        startDate: null,
                        updatedAt: new Date().toISOString(),
                        status: 'DRAFT',
                        title: 't',
                        contractType: '',
                        currency: '',
                        paymentTerms: '',
                        documentUrl: null,
                        description: '',
                    },
                ],
                recordsTotal: 1,
                statusCounts: AGREEMENT_STATUS_COUNTS_DEFAULT,
            },
        });

        const { result } = renderHook(() => useAgreementData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.agreements[0].customer).toBe('-');
        expect(result.current.agreements[0].startDate).toBe('-');
        expect(result.current.agreements[0].hasDocument).toBe(false);
    });

    it('shows error toast when API responds with status false', async () => {
        (getAllAgreementsApi as any).mockResolvedValueOnce({ status: false, message: 'oops' });

        const { result } = renderHook(() => useAgreementData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({ description: 'oops', variant: 'error' });
        expect(result.current.agreements).toEqual([]);
        expect(result.current.recordsTotal).toBe(0);
    });

    it('does nothing visible when API returns falsy', async () => {
        (getAllAgreementsApi as any).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useAgreementData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).not.toHaveBeenCalled();
        expect(result.current.agreements).toEqual([]);
    });

    it('refetches when refetch is called', async () => {
        (getAllAgreementsApi as any).mockResolvedValue({
            status: true,
            data: {
                agreements: [],
                recordsTotal: 0,
                statusCounts: AGREEMENT_STATUS_COUNTS_DEFAULT,
            },
        });

        const { result } = renderHook(() => useAgreementData(baseFilters));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAllAgreementsApi).toHaveBeenCalledTimes(1);

        await result.current.refetch();
        expect(getAllAgreementsApi).toHaveBeenCalledTimes(2);
    });
});
