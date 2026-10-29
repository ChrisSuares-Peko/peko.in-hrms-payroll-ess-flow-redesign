import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SettingsDrawer from '../../components/SettingsDrawer';

const fetchSettings = vi.fn();

vi.mock('../../hooks/useSettings', () => ({
    default: () => ({
        settings: null,
        saveSettings: vi.fn(),
        isLoading: false,
        fetchSettings,
    }),
}));

vi.mock('../../forms/SettingsForm', () => ({
    default: () => <div data-testid="settings-form" />,
}));

describe('SettingsDrawer', () => {
    it('renders the drawer title and form when open', () => {
        render(<SettingsDrawer open onClose={vi.fn()} />);
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByTestId('settings-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Settings/i })).toBeInTheDocument();
    });

    it('calls fetchSettings when the drawer opens', () => {
        fetchSettings.mockClear();
        render(<SettingsDrawer open onClose={vi.fn()} />);
        expect(fetchSettings).toHaveBeenCalled();
    });

    it('fires onClose when Cancel button clicked', () => {
        const onClose = vi.fn();
        render(<SettingsDrawer open onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
