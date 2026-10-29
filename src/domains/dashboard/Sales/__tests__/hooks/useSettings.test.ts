import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getProfileAddressesApi,
    getProfileCompanyApi,
    getSettingsApi,
    saveSettingsApi,
} from '../../api/settings';
import useSettings from '../../hooks/useSettings';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../api/settings', () => ({
    getSettingsApi: vi.fn(),
    getProfileCompanyApi: vi.fn(),
    getProfileAddressesApi: vi.fn(),
    saveSettingsApi: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useSettings', () => {
    it('fetches settings + profile + addresses and merges into form values', async () => {
        (getSettingsApi as any).mockResolvedValueOnce({
            status: true,
            data: {
                autoUpdateDocumentNumber: false,
                documentNumberPrefix: [{ documentType: 'Invoice', prefix: 'INV-' }],
                termsAndConditions: 'TC',
                notes: 'Note',
                signatureUrl: 'sig.png',
            },
        });
        (getProfileCompanyApi as any).mockResolvedValueOnce({
            name: 'Acme',
            mobileNo: '999',
            email: 'a@b.com',
            gstNumber: 'GST',
            logo: 'logo.png',
        });
        (getProfileAddressesApi as any).mockResolvedValueOnce([
            {
                default: 1,
                addressLine1: 'L1',
                addressLine2: 'L2',
                city: 'KL',
                state: 'KL',
                zipCode: '111111',
            },
        ]);

        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.settings).toMatchObject({
            businessName: 'Acme',
            address: 'L1, L2',
            city: 'KL',
            state: 'KL',
            pincode: '111111',
            phone: '999',
            email: 'a@b.com',
            gstNo: 'GST',
            autoUpdateDocNumber: false,
            termsAndConditions: 'TC',
            notes: 'Note',
            logoUrl: 'logo.png',
            signatureUrl: 'sig.png',
        });
    });

    it('skips company API call when skipProfile is true', async () => {
        (getSettingsApi as any).mockResolvedValueOnce({
            status: true,
            data: { autoUpdateDocumentNumber: true },
        });
        (getProfileAddressesApi as any).mockResolvedValueOnce([]);

        const { result } = renderHook(() => useSettings({ skipProfile: true }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getProfileCompanyApi).not.toHaveBeenCalled();
        expect(result.current.settings?.businessName).toBe('');
    });

    it('shows error toast when settings API status is false', async () => {
        (getSettingsApi as any).mockResolvedValueOnce({ status: false, message: 'denied' });
        (getProfileCompanyApi as any).mockResolvedValueOnce(null);
        (getProfileAddressesApi as any).mockResolvedValueOnce([]);

        renderHook(() => useSettings());

        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith({ description: 'denied', variant: 'error' })
        );
    });

    it('does not auto-fetch when autoFetch is false', async () => {
        renderHook(() => useSettings({ autoFetch: false }));

        // Allow microtasks to flush so the effect runs (it should no-op).
        await Promise.resolve();
        expect(getSettingsApi).not.toHaveBeenCalled();
    });

    it('saveSettings shows success toast and refetches on success', async () => {
        (getSettingsApi as any).mockResolvedValue({
            status: true,
            data: { autoUpdateDocumentNumber: true },
        });
        (getProfileCompanyApi as any).mockResolvedValue(null);
        (getProfileAddressesApi as any).mockResolvedValue([]);
        (saveSettingsApi as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useSettings({ skipProfile: true }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const initialFetches = (getSettingsApi as any).mock.calls.length;

        await act(async () => {
            await result.current.saveSettings({
                businessDetails: {} as any,
                documentSettings: {
                    autoUpdateDocNumber: true,
                    termsAndConditions: 'tc',
                    notes: 'nt',
                    signature: null,
                    removeSignature: false,
                    documentPrefixes: undefined,
                } as any,
            });
        });

        expect(saveSettingsApi).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'u',
                userType: 'merchant',
                autoUpdateDocumentNumber: true,
                termsAndConditions: 'tc',
                notes: 'nt',
            })
        );
        expect(showToast).toHaveBeenCalledWith({
            description: 'Settings saved successfully.',
            variant: 'success',
        });
        await waitFor(() => {
            expect((getSettingsApi as any).mock.calls.length).toBeGreaterThan(initialFetches);
        });
    });

    it('saveSettings shows error toast on failure', async () => {
        (getSettingsApi as any).mockResolvedValue({
            status: true,
            data: { autoUpdateDocumentNumber: true },
        });
        (getProfileCompanyApi as any).mockResolvedValue(null);
        (getProfileAddressesApi as any).mockResolvedValue([]);
        (saveSettingsApi as any).mockResolvedValueOnce({ status: false, message: 'fail' });

        const { result } = renderHook(() => useSettings({ skipProfile: true }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        (showToast as any).mockClear();

        await act(async () => {
            await result.current.saveSettings({
                businessDetails: {} as any,
                documentSettings: {
                    autoUpdateDocNumber: true,
                    termsAndConditions: '',
                    notes: '',
                    signature: null,
                    documentPrefixes: undefined,
                } as any,
            });
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'fail', variant: 'error' });
    });
});
