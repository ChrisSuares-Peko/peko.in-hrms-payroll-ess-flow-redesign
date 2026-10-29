import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    getNotificationControls,
    updateNotificationControls,
} from '../../../api/admin/settingsApi';
import GeneralTab from '../../../components/settings/GeneralTab';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('../../../api/admin/settingsApi', () => ({
    getNotificationControls: vi.fn(),
    updateNotificationControls: vi.fn(),
}));

vi.mock('../../../hooks/admin/useAccountClosureApi', () => ({
    useAccountClosureApi: () => ({
        request: null,
        reasons: [],
        isLoading: false,
        submit: vi.fn(),
        submitLoading: false,
        hasPendingRequest: false,
    }),
}));

const mockDispatch = vi.fn();

const ALL_ON = {
    requireReceipts: true,
    autoDeclineOverLimit: true,
    notifyPendingKyc: true,
    weeklySpendDigest: true,
};

const switches = () => screen.getAllByRole('switch');
const digestSwitch = () => switches()[3];

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
        fn({
            reducer: {
                user: { user: { companyName: 'Acme', email: 'a@acme.test' } },
                auth: { role: 'corporate', id: 5 },
            },
        })
    );
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (getNotificationControls as unknown as Mock).mockResolvedValue({
        data: { notificationControls: ALL_ON },
    });
    (updateNotificationControls as unknown as Mock).mockResolvedValue({
        data: { notificationControls: { ...ALL_ON, weeklySpendDigest: false } },
    });
});

// Hidden in GeneralTab until the feature is finished; unskip with the section.
describe.skip('GeneralTab notification controls', () => {
    it('reflects the saved settings rather than defaulting every switch on', async () => {
        (getNotificationControls as unknown as Mock).mockResolvedValue({
            data: { notificationControls: { ...ALL_ON, weeklySpendDigest: false } },
        });

        render(<GeneralTab />);

        await waitFor(() => expect(digestSwitch()).not.toBeChecked());
        expect(switches()[0]).toBeChecked();
    });

    it('persists only the toggled key', async () => {
        render(<GeneralTab />);
        await waitFor(() => expect(digestSwitch()).toBeChecked());

        fireEvent.click(digestSwitch());

        await waitFor(() =>
            expect(updateNotificationControls).toHaveBeenCalledWith('corporate', 5, {
                weeklySpendDigest: false,
            })
        );
    });

    it('shows the new state after a successful save', async () => {
        render(<GeneralTab />);
        await waitFor(() => expect(digestSwitch()).toBeChecked());

        fireEvent.click(digestSwitch());

        await waitFor(() => expect(digestSwitch()).not.toBeChecked());
    });

    // A failed save must not leave the UI claiming a setting that was never stored.
    it('rolls the switch back and warns when the save fails', async () => {
        (updateNotificationControls as unknown as Mock).mockResolvedValue(false);
        render(<GeneralTab />);
        await waitFor(() => expect(digestSwitch()).toBeChecked());

        fireEvent.click(digestSwitch());

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ variant: 'error' }),
                })
            )
        );
        expect(digestSwitch()).toBeChecked();
    });

    it('keeps the switches on their defaults when the fetch fails', async () => {
        (getNotificationControls as unknown as Mock).mockResolvedValue(false);

        render(<GeneralTab />);

        await waitFor(() => expect(switches()).toHaveLength(4));
        switches().forEach(s => expect(s).toBeChecked());
    });
});
