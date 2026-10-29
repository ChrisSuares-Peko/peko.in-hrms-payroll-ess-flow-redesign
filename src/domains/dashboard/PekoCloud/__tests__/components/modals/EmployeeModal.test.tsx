import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EmployeeModal from '../../../components/Modals/EmployeeModal';
import useEmployeeCreate from '../../../hooks/employeeHooks/useCreateEmployeeApi';
import { useUpdateEmployee } from '../../../hooks/employeeHooks/useUpdateEmployeeApi';

// Mock the dependencies
vi.mock('@hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/employeeHooks/useCreateEmployeeApi', () => ({
    default: vi.fn(() => ({
        handleEmployeeCreation: vi.fn(),
        submitLoading: false,
    })),
}));

vi.mock('../../../hooks/employeeHooks/useUpdateEmployeeApi', () => ({
    useUpdateEmployee: vi.fn(() => ({
        updateEmployee: vi.fn(),
        submitLoading: false,
    })),
}));

describe('EmployeeModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <EmployeeModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Add Employee')).toBeInTheDocument();
        expect(screen.getByText('Employee Name')).toBeInTheDocument();
        expect(screen.getByText('Employee ID')).toBeInTheDocument();
        expect(screen.getByText('Employee Email')).toBeInTheDocument();
        expect(screen.getByText('Employee Department')).toBeInTheDocument();
        expect(screen.getByText('Date of Joining')).toBeInTheDocument();
        expect(screen.getByText('Profile Picture')).toBeInTheDocument();
    });

    it('calls handleEmployeeCreation on form submit when adding a new employee', async () => {
        const handleEmployeeCreation = vi.fn();
        (useEmployeeCreate as any).mockReturnValue({
            handleEmployeeCreation,
            submitLoading: false,
        });

        render(
            <EmployeeModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter employee name'), {
            target: { value: 'John Doe' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter employee ID'), {
            target: { value: 'E12345' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter employee email ID'), {
            target: { value: 'john.doe@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter employee department'), {
            target: { value: 'Engineering' },
        });

        // Simulate date of join selection
        const calendarIcon = screen.getByRole('img', { name: /calendar/i });
        fireEvent.click(calendarIcon);
        fireEvent.click(screen.getByText('Today'));

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => {
            expect(handleEmployeeCreation).toHaveBeenCalled();
        });
    });

    it('calls updateEmployee when editing an existing record', async () => {
        const updateEmployee = vi.fn();
        (useUpdateEmployee as any).mockReturnValue({
            updateEmployee,
            submitLoading: false,
        });

        const selectedRecordData = {
            id: 1,
            employeeName: 'John Doe',
            employeeId: 'E12345',
            employeeEmail: 'john.doe@example.com',
            department: 'Engineering',
            joiningDate: '2024-01-01',
        };

        render(
            <EmployeeModal
                open
                handleCancel={mockHandleCancel}
                selectedRecordData={selectedRecordData}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.change(screen.getByPlaceholderText('Enter employee name'), {
            target: { value: 'Jane Doe' },
        });

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() =>
            expect(updateEmployee).toHaveBeenCalledWith(
                expect.objectContaining({ employeeName: 'Jane Doe' }),
                selectedRecordData.id
            )
        );
    });

    it('renders loading state correctly', () => {
        (useEmployeeCreate as any).mockReturnValue({
            handleEmployeeCreation: vi.fn(),
            submitLoading: true,
        });
        (useUpdateEmployee as any).mockReturnValue({
            updateEmployee: vi.fn(),
            submitLoading: true,
        });

        render(
            <EmployeeModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(
            <EmployeeModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
                reloadInfo={mockReloadInfo}
            />,
            { wrapper: MemoryRouter }
        );

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });
});
