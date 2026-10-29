import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import {
    getProfileAddressesApi,
    getProfileCompanyApi,
    getSettingsApi,
    saveSettingsApi,
} from '../../api/settings';
import useSettings from '../../hooks/useSettings';

vi.mock('../../api/settings', () => ({
    getProfileAddressesApi: vi.fn(),
    getProfileCompanyApi: vi.fn(),
    getSettingsApi: vi.fn(),
    saveSettingsApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch settings on mount and populate state', async () => {
        (getSettingsApi as Mock).mockResolvedValue({
            status: true,
            data: {
                autoUpdateDocumentNumber: true,
                documentNumberPrefix: [],
                termsAndConditions: 'T&C',
                notes: 'note',
                signatureUrl: null,
            },
        });
        (getProfileCompanyApi as Mock).mockResolvedValue({
            name: 'Acme',
            email: 'a@b.com',
            mobileNo: '999',
            gstNumber: 'GST',
            logo: 'logo.png',
        });
        (getProfileAddressesApi as Mock).mockResolvedValue([
            {
                default: 1,
                addressLine1: 'Line1',
                addressLine2: 'Line2',
                city: 'City',
                state: 'KA',
                zipCode: '560001',
            },
        ]);

        const { result } = renderHook(() => useSettings());

        await waitFor(() => expect(result.current.isLoading).toBeFalsy());
        expect(result.current.settings?.businessName).toBe('Acme');
        expect(result.current.settings?.city).toBe('City');
        expect(result.current.settings?.termsAndConditions).toBe('T&C');
    });

    it('should show error toast when settings API returns failure', async () => {
        (getSettingsApi as Mock).mockResolvedValue({ status: false, message: 'boom' });
        (getProfileCompanyApi as Mock).mockResolvedValue(null);
        (getProfileAddressesApi as Mock).mockResolvedValue([]);

        renderHook(() => useSettings());

        await waitFor(() =>
            expect(dispatchMock).toHaveBeenCalledWith(
                showToast({ description: 'boom', variant: 'error' })
            )
        );
    });

    it('should not auto-fetch when autoFetch is false', async () => {
        renderHook(() => useSettings({ autoFetch: false }));
        await waitFor(() => expect(getSettingsApi).not.toHaveBeenCalled());
    });

    it('should save settings and show success toast', async () => {
        (getSettingsApi as Mock).mockResolvedValue({
            status: true,
            data: { autoUpdateDocumentNumber: true, documentNumberPrefix: [] },
        });
        (getProfileCompanyApi as Mock).mockResolvedValue({});
        (getProfileAddressesApi as Mock).mockResolvedValue([]);
        (saveSettingsApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useSettings());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.saveSettings({
                businessDetails: {} as any,
                documentSettings: {
                    autoUpdateDocNumber: true,
                    termsAndConditions: 't',
                    notes: 'n',
                    signature: null,
                    removeSignature: false,
                    documentPrefixes: undefined,
                } as any,
            });
        });

        expect(saveSettingsApi).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Settings saved successfully.', variant: 'success' })
        );
    });

    it('should show error toast when save API returns failure', async () => {
        (getSettingsApi as Mock).mockResolvedValue({
            status: true,
            data: { autoUpdateDocumentNumber: true, documentNumberPrefix: [] },
        });
        (getProfileCompanyApi as Mock).mockResolvedValue({});
        (getProfileAddressesApi as Mock).mockResolvedValue([]);
        (saveSettingsApi as Mock).mockResolvedValue({ status: false, message: 'nope' });

        const { result } = renderHook(() => useSettings());
        await waitFor(() => expect(result.current.isLoading).toBeFalsy());

        await act(async () => {
            await result.current.saveSettings({
                businessDetails: {} as any,
                documentSettings: {
                    autoUpdateDocNumber: true,
                    termsAndConditions: '',
                    notes: '',
                    signature: null,
                } as any,
            });
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'nope', variant: 'error' })
        );
    });
});
