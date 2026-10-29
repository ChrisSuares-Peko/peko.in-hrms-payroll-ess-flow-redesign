import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getEInvoiceNextNumberApi } from '../../../api/eInvoice';
import { getProfileAddressesApi, getProfileCompanyApi } from '../../../api/settings';
import useIrnSettings from '../../../hooks/generateIrn/useIrnSettings';

vi.mock('../../../api/eInvoice', () => ({
    getEInvoiceNextNumberApi: vi.fn(),
}));

vi.mock('../../../api/settings', () => ({
    getProfileCompanyApi: vi.fn(),
    getProfileAddressesApi: vi.fn(),
}));

const settingsHookMock = vi.fn();
vi.mock('../../../hooks/useSettings', () => ({
    default: () => settingsHookMock(),
}));

const useAppSelectorMock = vi.fn();
vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: 'u1', role: 'admin' },
                eInvoiceAuth: { gstin: 'GSTIN-1' },
                ...useAppSelectorMock(),
            },
        }),
}));

describe('useIrnSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppSelectorMock.mockReturnValue({});
        settingsHookMock.mockReturnValue({
            settings: {
                documentPrefixes: { Invoice: 'INV' },
            },
            isLoading: false,
        });
        (getProfileCompanyApi as Mock).mockResolvedValue({
            name: 'Biz',
            city: 'City',
            state: '29',
        });
        (getProfileAddressesApi as Mock).mockResolvedValue([
            {
                addressLine1: 'Addr',
                addressLine2: null,
                city: 'City',
                zipCode: '560001',
                state: '29',
                default: 1,
            },
        ]);
    });

    it('fetches next number and exposes it as a string', async () => {
        (getEInvoiceNextNumberApi as Mock).mockResolvedValue({ nextNumber: 42 });
        const { result } = renderHook(() => useIrnSettings());

        await waitFor(() => expect(result.current.isSettingsLoading).toBe(false));
        expect(result.current.nextNumber).toBe('42');
    });

    it('builds seller defaults from company/address apis after fetchSellerDefaults', async () => {
        (getEInvoiceNextNumberApi as Mock).mockResolvedValue({ nextNumber: 1 });
        const { result } = renderHook(() => useIrnSettings());

        await act(async () => {
            await result.current.fetchSellerDefaults();
        });

        expect(result.current.sellerDefaults).toEqual({
            sellerGstin: 'GSTIN-1',
            legalName: 'Biz',
            tradeName: '',
            address1: 'Addr',
            location: 'City',
            pinCode: '560001',
            state: '29',
        });
    });

    it('maps IRN doc type codes to the Invoice prefix', async () => {
        (getEInvoiceNextNumberApi as Mock).mockResolvedValue({ nextNumber: 1 });
        const { result } = renderHook(() => useIrnSettings());

        await waitFor(() => expect(result.current.isSettingsLoading).toBe(false));
        expect(result.current.prefixMap).toEqual({ INV: 'INV', CRN: 'INV', DBN: 'INV' });
    });

    it('falls back to empty strings when settings missing', async () => {
        settingsHookMock.mockReturnValue({ settings: null, isLoading: false });
        (getEInvoiceNextNumberApi as Mock).mockResolvedValue({ nextNumber: 1 });
        const { result } = renderHook(() => useIrnSettings());

        await waitFor(() => expect(result.current.isSettingsLoading).toBe(false));
        expect(result.current.sellerDefaults.legalName).toBe('');
        expect(result.current.prefixMap.INV).toBe('');
    });

    it('keeps nextNumber empty when api returns null', async () => {
        (getEInvoiceNextNumberApi as Mock).mockResolvedValue(null);
        const { result } = renderHook(() => useIrnSettings());
        await waitFor(() => expect(result.current.isSettingsLoading).toBe(false));
        expect(result.current.nextNumber).toBe('');
    });
});
