import React from 'react';

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component and hooks
import { useAppDispatch } from '@src/hooks/store';

import AssignSoftwareModal from '../../../components/Modals/AssignSoftwareModal';
import { useGetEmployee } from '../../../hooks/employeeHooks/useGetEmployeeApi';
import useAssignSubscription from '../../../hooks/subscriptionHooks/useAssignSubscriptionApi';
import { useGetSubscriptions } from '../../../hooks/subscriptionHooks/useGetSubscriptionsApi';

// Mock the dependencies
vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../hooks/employeeHooks/useGetEmployeeApi', () => ({
    useGetEmployee: vi.fn(() => ({
        data: [],
        generateEmployeesDropdown: vi.fn(() => []),
    })),
}));

vi.mock('../../../hooks/subscriptionHooks/useGetSubscriptionsApi', () => ({
    useGetSubscriptions: vi.fn(() => ({
        subscriptionsData: [],
        generateSubscriptionsDropdown: vi.fn(() => []),
    })),
}));

vi.mock('../../../hooks/subscriptionHooks/useAssignSubscriptionApi', () => ({
    default: vi.fn(() => ({
        handleAssignSubscription: vi.fn(),
        submitLoading: false,
    })),
}));

describe('AssignSoftwareModal', () => {
    const mockHandleCancel = vi.fn();
    const mockReloadTable = vi.fn();

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <AssignSoftwareModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        expect(screen.getByText('Assign Subscription')).toBeInTheDocument();
        expect(screen.getByText('Select employees')).toBeInTheDocument();
        expect(screen.getByText('Select software')).toBeInTheDocument();
    });

    it('calls handleAssignSubscription on form submit', async () => {
        const handleAssignSubscription = vi.fn();

        (useAssignSubscription as any).mockReturnValue({
            handleAssignSubscription,
            submitLoading: false,
        });

        (useGetEmployee as any).mockReturnValue({
            data: [{ id: 1, employee: 'Jane Doe', employeeId: 'EMP456' }],
            generateEmployeesDropdown: vi.fn(() => [{ value: 1, label: 'Jane Doe - EMP456' }]),
        });

        (useGetSubscriptions as any).mockReturnValue({
            subscriptionsData: [{ id: 1, name: 'Software 1', assignTo: [] }],
            generateSubscriptionsDropdown: vi.fn(() => [{ value: 1, label: 'Software 1' }]),
        });

        render(
            <AssignSoftwareModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        // Open the employee select dropdown
        fireEvent.mouseDown(screen.getByText('Select employees'));

        // Select an employee from the dropdown
        const employeeOption = await screen.findByText('Jane Doe - EMP456');
        fireEvent.click(employeeOption);

        // Open the software select dropdown
        fireEvent.mouseDown(screen.getByText('Select software'));

        // Select a software from the dropdown
        const softwareOption = await screen.findByText('Software 1');
        fireEvent.click(softwareOption);

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() => expect(handleAssignSubscription).toHaveBeenCalled());
    });

    it('renders loading state correctly', () => {
        (useAssignSubscription as any).mockReturnValue({
            handleAssignSubscription: vi.fn(),
            submitLoading: true,
        });

        render(<AssignSoftwareModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        expect(screen.getByLabelText('loading')).toBeInTheDocument();
    });

    it('calls handleCancel when cancel button is clicked', () => {
        render(<AssignSoftwareModal open handleCancel={mockHandleCancel} />, {
            wrapper: MemoryRouter,
        });

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockHandleCancel).toHaveBeenCalled();
    });

    it('shows error toast when subscription is already assigned to selected employee', async () => {
        const mockDispatch = vi.fn();
        (useAppDispatch as any).mockReturnValue(mockDispatch);

        (useAssignSubscription as any).mockReturnValue({
            handleAssignSubscription: vi.fn(),
            submitLoading: false,
        });

        (useGetEmployee as any).mockReturnValue({
            data: [{ id: 1, employee: 'Jane Doe', employeeId: 'EMP456' }],
            generateEmployeesDropdown: vi.fn(() => [{ value: 1, label: 'Jane Doe - EMP456' }]),
        });

        (useGetSubscriptions as any).mockReturnValue({
            subscriptionsData: [
                { id: 1, name: 'Software 1', assignTo: [{ id: 1, employeeName: 'Jane Doe' }] },
            ],
            generateSubscriptionsDropdown: vi.fn(() => [{ value: 1, label: 'Software 1' }]),
        });

        render(
            <AssignSoftwareModal
                open
                handleCancel={mockHandleCancel}
                reloadTable={mockReloadTable}
            />,
            { wrapper: MemoryRouter }
        );

        // Open the software select dropdown
        fireEvent.mouseDown(screen.getByText('Select software'));

        // Select a software from the dropdown
        const softwareOption = await screen.findByText('Software 1');
        fireEvent.click(softwareOption);

        // Open the employee select dropdown
        fireEvent.mouseDown(screen.getByText('Select employees'));

        // Select an employee from the dropdown
        const employeeOption = await screen.findByText('Jane Doe - EMP456');
        fireEvent.click(employeeOption);

        fireEvent.click(screen.getByRole('button', { name: /submit/i }));

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith({
                type: 'api/showToast',
                payload: {
                    description: 'Subscription is already assigned to the employee',
                    variant: 'error',
                },
            })
        );
    });
});
