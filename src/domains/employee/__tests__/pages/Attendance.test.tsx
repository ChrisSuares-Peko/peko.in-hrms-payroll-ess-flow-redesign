import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAttendance } from '../../hooks/useAttendance';
import { useOvertime } from '../../hooks/useOvertime';
import Attendance from '../../pages/Attendance';

vi.mock('../../hooks/useAttendance', () => ({
    useAttendance: vi.fn(),
}));

vi.mock('../../hooks/useOvertime', () => ({
    useOvertime: vi.fn(),
}));

vi.mock('../../components/AttendanceFilters', () => ({
    default: ({ statusValue, statusOptions, onStatusChange, search, onSearchChange }: any) => (
        <div data-testid="attendance-filters">
            <select
                aria-label="status-filter"
                value={statusValue}
                onChange={e => onStatusChange(e.target.value)}
            >
                {statusOptions.map((o: any) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <input
                aria-label="search-filter"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
            />
        </div>
    ),
}));

vi.mock('../../components/RequestOvertimeModal', () => ({
    default: ({ open }: any) =>
        open ? <div data-testid="request-overtime-modal" /> : null,
}));

const attendanceRecords = [
    {
        key: 'a1',
        date: 'Mon Jan 5',
        rawDate: '2026-01-05',
        checkIn: '09:00',
        checkOut: '18:00',
        hours: '9h 00m',
        status: 'Present',
        isLate: false,
    },
    {
        key: 'a2',
        date: 'Tue Jan 6',
        rawDate: '2026-01-06',
        checkIn: '09:45',
        checkOut: '18:00',
        hours: '8h 15m',
        status: 'Late',
        isLate: true,
    },
    {
        key: 'a3',
        date: 'Wed Jan 7',
        rawDate: '2026-01-07',
        checkIn: null,
        checkOut: null,
        hours: null,
        status: 'Leave',
        isLate: false,
    },
];

const overtimeRecords = [
    {
        key: 'o1',
        date: 'Thu Jan 15',
        rawDate: '2026-01-15',
        hours: '2h',
        description: 'Server maintenance',
        status: 'Approved',
        canCancel: false,
    },
    {
        key: 'o2',
        date: 'Fri Jan 16',
        rawDate: '2026-01-16',
        hours: '3h',
        description: 'Release support',
        status: 'Pending',
        canCancel: true,
    },
];

const setup = () => {
    const fetchAttendance = vi.fn();
    const fetchOvertime = vi.fn();
    const requestOvertime = vi.fn();
    const cancelOvertime = vi.fn();

    (useAttendance as Mock).mockReturnValue({ records: attendanceRecords, fetchAttendance });
    (useOvertime as Mock).mockReturnValue({
        records: overtimeRecords,
        fetchOvertime,
        requestOvertime,
        cancelOvertime,
    });

    return { fetchAttendance, fetchOvertime, requestOvertime, cancelOvertime };
};

describe('Attendance Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the page heading and both tabs, defaulting to History', () => {
        setup();

        render(<Attendance />);

        expect(screen.getByText('Attendance')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'History' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Overtime' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
    });

    it('fetches attendance on mount and shows the history stats and rows', () => {
        const { fetchAttendance } = setup();

        render(<Attendance />);

        expect(fetchAttendance).toHaveBeenCalled();

        expect(screen.getByText('Present Days')).toBeInTheDocument();
        expect(screen.getByText('Late Arrivals')).toBeInTheDocument();
        expect(screen.getByText('Leave Days')).toBeInTheDocument();

        expect(screen.getByText('Mon Jan 5')).toBeInTheDocument();
        expect(screen.getByText('Tue Jan 6')).toBeInTheDocument();
        expect(screen.getByText('Wed Jan 7')).toBeInTheDocument();
    });

    it('filters the history rows when the status filter changes', () => {
        setup();

        render(<Attendance />);

        const panel = screen.getByRole('tabpanel');
        const statusSelect = within(panel).getByLabelText('status-filter');

        fireEvent.change(statusSelect, { target: { value: 'Late' } });

        expect(screen.queryByText('Mon Jan 5')).not.toBeInTheDocument();
        expect(screen.getByText('Tue Jan 6')).toBeInTheDocument();
        expect(screen.queryByText('Wed Jan 7')).not.toBeInTheDocument();
    });

    it('filters the history rows by search text', () => {
        setup();

        render(<Attendance />);

        const panel = screen.getByRole('tabpanel');
        const searchInput = within(panel).getByLabelText('search-filter');

        fireEvent.change(searchInput, { target: { value: 'wed' } });

        expect(screen.queryByText('Mon Jan 5')).not.toBeInTheDocument();
        expect(screen.queryByText('Tue Jan 6')).not.toBeInTheDocument();
        expect(screen.getByText('Wed Jan 7')).toBeInTheDocument();
    });

    it('switches to the Overtime tab and shows overtime stats, rows, and the request action', () => {
        const { fetchOvertime } = setup();

        render(<Attendance />);

        fireEvent.click(screen.getByRole('tab', { name: 'Overtime' }));

        expect(fetchOvertime).toHaveBeenCalled();
        expect(screen.getByText('Total OT Hours')).toBeInTheDocument();
        expect(screen.getByText('2h 00m')).toBeInTheDocument();
        expect(screen.getByText('Approved Sessions')).toBeInTheDocument();
        expect(screen.getByText('Pending Requests')).toBeInTheDocument();
        expect(screen.getByText('Thu Jan 15')).toBeInTheDocument();
        expect(screen.getByText('Fri Jan 16')).toBeInTheDocument();

        expect(screen.queryByTestId('request-overtime-modal')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Request Overtime/i }));
        expect(screen.getByTestId('request-overtime-modal')).toBeInTheDocument();
    });

    it('shows a Cancel action only for overtime rows that can be cancelled', () => {
        setup();

        render(<Attendance />);

        fireEvent.click(screen.getByRole('tab', { name: 'Overtime' }));

        const rows = screen.getAllByRole('row');
        const approvedRow = rows.find(row => within(row).queryByText('Server maintenance'));
        const pendingRow = rows.find(row => within(row).queryByText('Release support'));

        expect(approvedRow && within(approvedRow).queryByText('Cancel')).toBeFalsy();
        expect(pendingRow && within(pendingRow).queryByText('Cancel')).toBeTruthy();
    });
});
