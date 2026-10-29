import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import SettingsDrawer from '../../components/SettingsDrawer';
import useSettings from '../../hooks/useSettings';

vi.mock('../../hooks/useSettings', () => ({ default: vi.fn() }));
vi.mock('../../forms/SettingsForm', () => ({
    default: () => <div data-testid="settings-form" />,
}));
vi.mock('../../components/shared/LeftHeader', () => ({
    default: ({ title }: any) => <div>{title}</div>,
}));

const fetchSettings = vi.fn();
const saveSettings = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useSettings as any).mockReturnValue({
        settings: null,
        saveSettings,
        isLoading: false,
        fetchSettings,
    });
});

describe('SettingsDrawer', () => {
    it('triggers fetchSettings when opened', () => {
        const { rerender } = render(<SettingsDrawer open={false} onClose={() => {}} />);
        expect(fetchSettings).not.toHaveBeenCalled();

        rerender(<SettingsDrawer open onClose={() => {}} />);
        expect(fetchSettings).toHaveBeenCalled();
    });

    it('renders the SettingsForm when not in initial-loading state', () => {
        render(<SettingsDrawer open onClose={() => {}} />);

        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByTestId('settings-form')).toBeInTheDocument();
    });

    it('renders the loading spinner when isLoading and no settings yet', () => {
        (useSettings as any).mockReturnValue({
            settings: null,
            saveSettings,
            isLoading: true,
            fetchSettings,
        });

        render(<SettingsDrawer open onClose={() => {}} />);

        // Drawer portals to document.body.
        expect(document.body.querySelector('.ant-spin')).not.toBeNull();
        expect(screen.queryByTestId('settings-form')).not.toBeInTheDocument();
    });

    it('triggers onClose when Cancel button is clicked', () => {
        const onClose = vi.fn();
        render(<SettingsDrawer open onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows loading state on Save button when isLoading', () => {
        (useSettings as any).mockReturnValue({
            settings: { businessName: 'Acme' } as any,
            saveSettings,
            isLoading: true,
            fetchSettings,
        });

        render(<SettingsDrawer open onClose={() => {}} />);

        const saveBtn = screen.getByRole('button', { name: /save settings/i });
        expect(saveBtn.className).toContain('ant-btn-loading');
    });

    it('calls saveSettings and onClose on successful save', async () => {
        saveSettings.mockResolvedValueOnce(undefined);
        const onClose = vi.fn();
        (useSettings as any).mockReturnValue({
            settings: {
                businessName: 'Acme Co',
                address: 'Line 1',
                city: 'Kochi',
                state: 'Kerala',
                pincode: '111111',
                phone: '9999999999',
                email: 'a@b.com',
                gstNo: '',
                autoUpdateDocNumber: true,
                selectedDocumentType: 'Invoice',
                documentPrefixes: {
                    Invoice: 'INV',
                    Quotation: 'QO',
                    'Sales Order': 'SO',
                    Agreement: 'AGR',
                },
                termsAndConditions: 'TC',
                notes: 'N',
                signature: null,
                removeSignature: false,
            } as any,
            saveSettings,
            isLoading: false,
            fetchSettings,
        });

        render(<SettingsDrawer open onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

        await waitFor(() => {
            expect(saveSettings).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });
});
