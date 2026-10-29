import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import MarkAttendanceForm from '../../../components/modals/MarkAttendanceForm';
import GetEmployeeDetails from '../../../hooks/employeeHooks/useReportingStaffApi';

vi.mock('../../../hooks/employeeHooks/useReportingStaffApi', () => ({
    default: vi.fn(),
}));

const defaultValues = {
    employee: '',
    date: '',
    checkIn: '',
    checkOut: '',
    status: 'present',
    notes: '',
};

const renderForm = (props = {}) =>
    render(
        <Formik initialValues={defaultValues} onSubmit={vi.fn()}>
            <MarkAttendanceForm {...props} />
        </Formik>
    );

beforeEach(() => {
    vi.clearAllMocks();
    (GetEmployeeDetails as Mock).mockReturnValue({
        data: [{ key: 0, value: 'emp-1', label: 'John Doe' }],
        isLoading: false,
    });
});

describe('MarkAttendanceForm', () => {
    describe('disabled branch (disableEmployee, disableDate, hideNotes all true)', () => {
        it('renders a read-only Employee input showing employeeName instead of the select', () => {
            renderForm({ disableEmployee: true, employeeName: 'Jane Doe' });

            const employeeInput = screen.getByDisplayValue('Jane Doe') as HTMLInputElement;
            expect(employeeInput).toBeDisabled();
            expect(screen.queryByText('Search employee...')).not.toBeInTheDocument();
        });

        it('renders a disabled Date input instead of the date picker', () => {
            renderForm({ disableDate: true });

            expect(screen.queryByPlaceholderText('Select date')).not.toBeInTheDocument();
            const dateFormItem = screen.getByText('Date').closest('.ant-form-item') as HTMLElement;
            expect(dateFormItem.querySelector('input')).toBeDisabled();
        });

        it('does not render the Notes field', () => {
            renderForm({ hideNotes: true });

            expect(
                screen.queryByPlaceholderText('Add any notes about this attendance record...')
            ).not.toBeInTheDocument();
        });
    });

    describe('enabled branch (disableEmployee, disableDate, hideNotes all false)', () => {
        it('renders the searchable Employee select instead of a plain input', () => {
            renderForm({ disableEmployee: false });

            expect(screen.getByText('Search employee...')).toBeInTheDocument();
            expect(GetEmployeeDetails).toHaveBeenCalled();
        });

        it('renders the editable date picker instead of the disabled Date input', () => {
            renderForm({ disableDate: false });

            expect(screen.getByPlaceholderText('Select date')).toBeInTheDocument();
        });

        it('renders the Notes field', () => {
            renderForm({ hideNotes: false });

            expect(
                screen.getByPlaceholderText('Add any notes about this attendance record...')
            ).toBeInTheDocument();
        });
    });

    it('renders Status and Check-In / Check-Out fields regardless of the toggle props', () => {
        renderForm({ disableEmployee: true, disableDate: true, hideNotes: true });

        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Check-In Time')).toBeInTheDocument();
        expect(screen.getByText('Check-Out Time')).toBeInTheDocument();
    });
});
