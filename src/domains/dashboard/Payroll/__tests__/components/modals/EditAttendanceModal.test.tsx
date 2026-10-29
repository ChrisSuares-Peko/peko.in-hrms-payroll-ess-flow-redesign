import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import { updateAttendance } from '../../../api/dashBoardIndex';
import EditAttendanceModal, {
    EditAttendanceInitialValues,
} from '../../../components/modals/EditAttendanceModal';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useDispatch: () => mockDispatch,
    };
});

vi.mock('../../../api/dashBoardIndex', () => ({
    updateAttendance: vi.fn(),
}));

const baseInitialValues: EditAttendanceInitialValues = {
    attendanceId: 'att-1',
    employeeId: 'emp-1',
    employeeName: 'Jane Doe',
    date: '2026-07-15',
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:00',
    lateMinutes: 0,
    notes: '',
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as Mock).mockImplementation((selector: any) =>
        selector({ reducer: { auth: { role: 'corporate', id: 42 } } })
    );
    (updateAttendance as Mock).mockResolvedValue({ success: true });
});

describe('EditAttendanceModal', () => {
    it('renders the form populated with initialValues when open', () => {
        render(
            <EditAttendanceModal
                open
                initialValues={baseInitialValues}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByText('Edit Attendance')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('15 Jul 2026')).toBeInTheDocument();
        expect(screen.getByText('Present')).toBeInTheDocument();
        expect(screen.getByDisplayValue('09:00 AM')).toBeInTheDocument();
        expect(screen.getByDisplayValue('06:00 PM')).toBeInTheDocument();
    });

    it('does not render anything when open is false', () => {
        render(
            <EditAttendanceModal
                open={false}
                initialValues={baseInitialValues}
                onCancel={vi.fn()}
            />
        );

        expect(screen.queryByText('Edit Attendance')).not.toBeInTheDocument();
    });

    it('renders the Date field as read-only (not editable)', () => {
        render(
            <EditAttendanceModal
                open
                initialValues={baseInitialValues}
                onCancel={vi.fn()}
            />
        );

        const dateInput = screen.getByDisplayValue('15 Jul 2026') as HTMLInputElement;
        expect(dateInput).toBeDisabled();
    });

    it('renders the Employee field as read-only (not editable)', () => {
        render(
            <EditAttendanceModal
                open
                initialValues={baseInitialValues}
                onCancel={vi.fn()}
            />
        );

        const employeeInput = screen.getByDisplayValue('Jane Doe') as HTMLInputElement;
        expect(employeeInput).toBeDisabled();
    });

    it('does not render a Notes field', () => {
        render(
            <EditAttendanceModal
                open
                initialValues={baseInitialValues}
                onCancel={vi.fn()}
            />
        );

        expect(screen.queryByText('Notes')).not.toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText('Add any notes about this attendance record...')
        ).not.toBeInTheDocument();
    });

    it('calls updateAttendance with the correct payload when Save is clicked', async () => {
        const onSuccess = vi.fn();
        const onCancel = vi.fn();

        render(
            <EditAttendanceModal
                open
                initialValues={baseInitialValues}
                onCancel={onCancel}
                onSuccess={onSuccess}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await vi.waitFor(() => {
            expect(updateAttendance).toHaveBeenCalledWith({
                userType: 'corporate',
                userId: 42,
                attendanceId: 'att-1',
                status: 'present',
                checkIn: '09:00',
                checkOut: '18:00',
                lateMinutes: 0,
                notes: undefined,
            });
        });

        await vi.waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onCancel).toHaveBeenCalled();
        });
    });

    it('shows an error toast and does not close when the update fails', async () => {
        (updateAttendance as Mock).mockResolvedValue({
            success: false,
            errorMessage: 'Something went wrong',
        });
        const onCancel = vi.fn();

        render(
            <EditAttendanceModal
                open
                initialValues={baseInitialValues}
                onCancel={onCancel}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await vi.waitFor(() => {
            expect(updateAttendance).toHaveBeenCalled();
        });

        expect(onCancel).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ description: 'Something went wrong', variant: 'error' }),
            })
        );
    });
});
