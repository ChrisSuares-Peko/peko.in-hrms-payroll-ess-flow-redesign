import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProfileCard from '../../../components/dashboard/ProfileCard';
import { DashboardProfile } from '../../../types';
import { formatHours } from '../../../utils/attendanceMappers';

const baseProfile: DashboardProfile = {
    name: 'Jane Doe',
    designation: 'Software Engineer',
    department: 'Engineering',
    employeeId: 'EMP-001',
    today: '2024-06-10T00:00:00.000Z',
    isCheckedIn: false,
    isCheckedOut: false,
    isLate: false,
    shiftComplete: false,
    checkInOutEnabled: true,
    isCheckInAvailable: true,
};

const buildProfile = (overrides: Partial<DashboardProfile> = {}): DashboardProfile => ({
    ...baseProfile,
    ...overrides,
});

const renderCard = (
    profile: DashboardProfile,
    overrides: Partial<{
        checkInLoading: boolean;
        checkOutLoading: boolean;
        onCheckIn: () => void;
        onCheckOut: () => void;
    }> = {}
) =>
    render(
        <ProfileCard
            profile={profile}
            checkInLoading={overrides.checkInLoading ?? false}
            checkOutLoading={overrides.checkOutLoading ?? false}
            onCheckIn={overrides.onCheckIn ?? vi.fn()}
            onCheckOut={overrides.onCheckOut ?? vi.fn()}
        />
    );

describe('ProfileCard', () => {
    it('renders profile info and the "Not Checked In" state with an enabled Check In button', () => {
        renderCard(buildProfile());

        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('EMP-001')).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('Not Checked In')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Check In' })).not.toBeDisabled();
    });

    it('disables Check In and shows the org hint when check-in/out is disabled', () => {
        renderCard(buildProfile({ checkInOutEnabled: false }));

        expect(screen.getByRole('button', { name: 'Check In' })).toBeDisabled();
        expect(screen.getByText('Check-in is disabled by your organization')).toBeInTheDocument();
    });

    it('shows the custom unavailable reason when check-in is not available today', () => {
        renderCard(
            buildProfile({
                isCheckInAvailable: false,
                checkInUnavailableReason: 'Already marked absent today',
            })
        );

        expect(screen.getByText('Already marked absent today')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Check In' })).toBeDisabled();
    });

    it('falls back to a default message when check-in is unavailable without a reason', () => {
        renderCard(buildProfile({ isCheckInAvailable: false }));

        expect(screen.getByText("Check-in isn't available today")).toBeInTheDocument();
    });

    it('opens the punch modal on Check In click and calls onCheckIn on confirm', () => {
        const onCheckIn = vi.fn();
        renderCard(buildProfile(), { onCheckIn });

        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('Start Your Shift?')).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Check In' }));

        expect(onCheckIn).toHaveBeenCalledTimes(1);
    });

    it('cancelling the punch modal does not call onCheckIn', () => {
        const onCheckIn = vi.fn();
        renderCard(buildProfile(), { onCheckIn });

        fireEvent.click(screen.getByRole('button', { name: 'Check In' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

        expect(onCheckIn).not.toHaveBeenCalled();
    });

    it('renders the "On the Clock" state and calls onCheckOut on punch-modal confirm', () => {
        const onCheckOut = vi.fn();
        renderCard(
            buildProfile({
                isCheckedIn: true,
                isCheckedOut: false,
                checkInTime: '2024-06-10T09:00:00.000Z',
            }),
            { onCheckOut }
        );

        expect(screen.getByText('On the Clock')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Check Out' }));
        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText('End Your Shift?')).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Check Out' }));
        expect(onCheckOut).toHaveBeenCalledTimes(1);
    });

    it('renders the "Late" state with the formatted late-minutes message', () => {
        renderCard(
            buildProfile({
                isCheckedIn: true,
                isCheckedOut: false,
                isLate: true,
                lateMinutes: 75,
                checkInTime: '2024-06-10T09:15:00.000Z',
            })
        );

        expect(screen.getByText('Late')).toBeInTheDocument();
        expect(screen.getByText(/1h 15m late/)).toBeInTheDocument();
    });

    it('renders "Shift Complete" with total hours once checked out and the shift is complete', () => {
        renderCard(
            buildProfile({
                isCheckedIn: true,
                isCheckedOut: true,
                shiftComplete: true,
                totalHours: 8.5,
            })
        );

        expect(screen.getByText('Shift Complete')).toBeInTheDocument();
        expect(screen.getByText('Great work today!')).toBeInTheDocument();
        expect(screen.getByText(formatHours(8.5) as string)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Check In' })).toBeDisabled();
    });

    it('renders "Checked Out" (shift not complete) without the "Great work" message', () => {
        renderCard(
            buildProfile({
                isCheckedIn: true,
                isCheckedOut: true,
                shiftComplete: false,
                totalHours: 3,
            })
        );

        expect(screen.getByText('Checked Out')).toBeInTheDocument();
        expect(screen.queryByText('Great work today!')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Check In' })).toBeDisabled();
    });
});
