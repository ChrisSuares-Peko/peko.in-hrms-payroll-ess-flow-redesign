import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { paths } from '@src/routes/paths';

import { useEmployeeDashboard } from '../../hooks/useEmployeeDashboard';
import Dashboard from '../../pages/Dashboard';

vi.mock('../../hooks/useEmployeeDashboard', () => ({
    useEmployeeDashboard: vi.fn(),
}));

vi.mock('../../components/dashboard/ProfileCard', () => ({
    default: (props: any) => (
        <div data-testid="profile-card" data-name={props.profile?.name}>
            <button type="button" onClick={props.onCheckIn}>
                mock-check-in
            </button>
            <button type="button" onClick={props.onCheckOut}>
                mock-check-out
            </button>
        </div>
    ),
}));

vi.mock('../../components/dashboard/StatCard', () => ({
    default: (props: any) => (
        <button type="button" data-testid="stat-card" onClick={props.onViewMore}>
            {props.title}
        </button>
    ),
}));

vi.mock('../../components/dashboard/ServiceShortcuts', () => ({
    default: () => <div data-testid="service-shortcuts" />,
}));

vi.mock('../../components/dashboard/AttendanceTable', () => ({
    default: (props: any) => (
        <div data-testid="attendance-table" data-count={props.records?.length ?? 0} />
    ),
}));

vi.mock('../../components/dashboard/AnnouncementsPanel', () => ({
    default: (props: any) => (
        <div data-testid="announcements-panel" data-count={props.announcements?.length ?? 0} />
    ),
}));

const buildData = () => ({
    profile: {
        name: 'Jane Doe',
        designation: 'Engineer',
        department: 'Tech',
        employeeId: 'EMP-1',
        today: new Date().toISOString(),
        isCheckedIn: false,
        isCheckedOut: false,
        isLate: false,
        shiftComplete: false,
        checkInOutEnabled: true,
        isCheckInAvailable: true,
    },
    attendance: { onTime: 10, late: 2, notPresent: 1, total: 13 },
    attendanceRecords: [
        { id: '1', name: '01-01-2026', joinDate: '09:00', checkout: '18:00', hours: '9h', status: 'Present' },
    ],
    announcements: [{ id: 'a1', title: 'Holiday', description: 'Office closed', date: '01-01-2026' }],
});

const renderWithRouter = (initialEntries: string[] = ['/employee']) =>
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path="/employee" element={<Dashboard />} />
                <Route path={paths.employee.attendance} element={<div>Attendance Page</div>} />
            </Routes>
        </MemoryRouter>
    );

describe('Dashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a loading skeleton while data is loading', () => {
        (useEmployeeDashboard as Mock).mockReturnValue({
            data: null,
            isLoading: true,
            checkInLoading: false,
            checkOutLoading: false,
            handleCheckIn: vi.fn(),
            handleCheckOut: vi.fn(),
        });

        const { container } = renderWithRouter();

        expect(container.querySelectorAll('.ant-skeleton').length).toBeGreaterThan(0);
        expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument();
    });

    it('renders all dashboard sections once data has loaded', () => {
        (useEmployeeDashboard as Mock).mockReturnValue({
            data: buildData(),
            isLoading: false,
            checkInLoading: false,
            checkOutLoading: false,
            handleCheckIn: vi.fn(),
            handleCheckOut: vi.fn(),
        });

        renderWithRouter();

        expect(screen.getByTestId('profile-card')).toHaveAttribute('data-name', 'Jane Doe');
        expect(screen.getByTestId('stat-card')).toBeInTheDocument();
        expect(screen.getByTestId('service-shortcuts')).toBeInTheDocument();
        expect(screen.getByTestId('attendance-table')).toHaveAttribute('data-count', '1');
        expect(screen.getByTestId('announcements-panel')).toHaveAttribute('data-count', '1');
    });

    it('navigates to the attendance page when "View more" is triggered on the stat card', () => {
        (useEmployeeDashboard as Mock).mockReturnValue({
            data: buildData(),
            isLoading: false,
            checkInLoading: false,
            checkOutLoading: false,
            handleCheckIn: vi.fn(),
            handleCheckOut: vi.fn(),
        });

        renderWithRouter();

        fireEvent.click(screen.getByTestId('stat-card'));

        expect(screen.getByText('Attendance Page')).toBeInTheDocument();
    });

    it('wires check-in/check-out handlers from the hook through to ProfileCard', () => {
        const handleCheckIn = vi.fn();
        const handleCheckOut = vi.fn();
        (useEmployeeDashboard as Mock).mockReturnValue({
            data: buildData(),
            isLoading: false,
            checkInLoading: false,
            checkOutLoading: false,
            handleCheckIn,
            handleCheckOut,
        });

        renderWithRouter();

        fireEvent.click(screen.getByText('mock-check-in'));
        fireEvent.click(screen.getByText('mock-check-out'));

        expect(handleCheckIn).toHaveBeenCalledTimes(1);
        expect(handleCheckOut).toHaveBeenCalledTimes(1);
    });
});
