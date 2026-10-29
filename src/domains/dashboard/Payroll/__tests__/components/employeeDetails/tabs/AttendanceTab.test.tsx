import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import AttendanceTab from '../../../../components/employeeDetails/tabs/AttendanceTab';
import { useDailyLog } from '../../../../hooks/dashboardHooks/useDailyLog';
import { useAttendanceMetrics } from '../../../../hooks/employeeHooks/useAttendanceMetrics';

vi.mock('../../../../hooks/dashboardHooks/useDailyLog', () => ({
    useDailyLog: vi.fn(),
}));

vi.mock('../../../../hooks/employeeHooks/useAttendanceMetrics', () => ({
    useAttendanceMetrics: vi.fn(),
}));

vi.mock('@src/components/atomic/GenericTable', () => ({
    default: ({ dataSource, loading }: any) => (
        <div data-testid="attendance-table">
            {loading ? 'loading' : `${(dataSource ?? []).length} rows`}
        </div>
    ),
}));

vi.mock('../../../../components/modals/EditAttendanceModal', () => ({
    default: ({ open }: any) => (open ? <div data-testid="edit-attendance-modal" /> : null),
}));

let capturedOnEdit: ((record: any) => void) | undefined;

vi.mock('../../../../utils/employeeDetails/attendanceData', async importOriginal => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        attendanceColumns: (onEdit: (record: any) => void) => {
            capturedOnEdit = onEdit;
            return actual.attendanceColumns(onEdit);
        },
    };
});

const mockRows = [
    {
        key: 'log-1',
        employeeId: 'emp-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        initials: 'JD',
        color: '#1677ff',
        date: '15 Jul 2026',
        shift: 'Day Shift',
        checkIn: '09:00 AM',
        checkOut: '06:00 PM',
        workHrs: '9h',
        otHours: '0h',
        status: 'Present',
        rawDate: '2026-07-15',
        rawCheckIn: '09:00',
        rawCheckOut: '18:00',
        rawStatus: 'present',
        rawNotes: '',
    },
];

const defaultMetrics = {
    present: 20,
    late: 3,
    absent: 1,
    onLeave: 2,
    otHours: 5,
    month: { from: '2026-07-01', to: '2026-07-31' },
};

const defaultDailyLog = {
    rows: mockRows,
    isLoading: false,
    pagination: { total: 1, page: 1, limit: 30, totalPages: 1 },
    refetch: vi.fn(),
};

beforeEach(() => {
    vi.clearAllMocks();
    capturedOnEdit = undefined;
    (useDailyLog as Mock).mockReturnValue(defaultDailyLog);
    (useAttendanceMetrics as Mock).mockReturnValue({
        metrics: defaultMetrics,
        isLoading: false,
        refetch: vi.fn(),
    });
});

describe('AttendanceTab', () => {
    it('renders the stat pills with metrics from the hook', () => {
        render(<AttendanceTab employeeId="emp-1" />);

        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Present')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Late')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Absent')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('On Leave')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('OT Hours')).toBeInTheDocument();
    });

    it('renders the table with rows from the hook', () => {
        render(<AttendanceTab employeeId="emp-1" />);

        expect(screen.getByTestId('attendance-table')).toHaveTextContent('1 rows');
    });

    it('passes the initial month/year (based on the current date) to the hooks', () => {
        render(<AttendanceTab employeeId="emp-1" />);

        expect(useAttendanceMetrics).toHaveBeenCalledWith('emp-1', '2026-07');
        expect(useDailyLog).toHaveBeenCalledWith(
            expect.objectContaining({
                employee: 'emp-1',
                from: '2026-07-01',
                to: '2026-07-31',
                page: 1,
            })
        );
    });

    it('re-fetches with the newly selected month when the month select changes', () => {
        render(<AttendanceTab employeeId="emp-1" />);

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[0]);
        const juneOptions = screen.getAllByText('June');
        fireEvent.click(juneOptions[juneOptions.length - 1]);

        expect(useAttendanceMetrics).toHaveBeenLastCalledWith('emp-1', '2026-06');
        expect(useDailyLog).toHaveBeenLastCalledWith(
            expect.objectContaining({ from: '2026-06-01', to: '2026-06-30' })
        );
    });

    it('re-fetches with the newly selected year when the year select changes', () => {
        render(<AttendanceTab employeeId="emp-1" />);

        const comboboxes = screen.getAllByRole('combobox');
        fireEvent.mouseDown(comboboxes[1]);
        const yearOptions = screen.getAllByText('2025');
        fireEvent.click(yearOptions[yearOptions.length - 1]);

        expect(useAttendanceMetrics).toHaveBeenLastCalledWith('emp-1', '2025-07');
        expect(useDailyLog).toHaveBeenLastCalledWith(
            expect.objectContaining({ from: '2025-07-01', to: '2025-07-31' })
        );
    });

    it('shows the skeleton placeholders while metrics are loading', () => {
        (useAttendanceMetrics as Mock).mockReturnValue({
            metrics: { present: 0, late: 0, absent: 0, onLeave: 0, otHours: 0, month: { from: '', to: '' } },
            isLoading: true,
            refetch: vi.fn(),
        });

        const { container } = render(<AttendanceTab employeeId="emp-1" />);

        expect(container.querySelectorAll('.ant-skeleton-input').length).toBeGreaterThan(0);
    });

    it('opens the EditAttendanceModal when a row edit is triggered', () => {
        render(<AttendanceTab employeeId="emp-1" />);

        expect(screen.queryByTestId('edit-attendance-modal')).not.toBeInTheDocument();
        expect(capturedOnEdit).toBeInstanceOf(Function);

        act(() => capturedOnEdit?.(mockRows[0]));

        expect(screen.getByTestId('edit-attendance-modal')).toBeInTheDocument();
    });
});
