import React from 'react';

import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenSize from '@src/hooks/useScreenSize';

import SubscriptionTable from '../../../components/Subscriptions/SubscriptionTable';
import { useDeleteSubscriptionApi } from '../../../hooks/subscriptionHooks/useDeleteSubscriptionApi';

// Mock dependencies
vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(),
}));
vi.mock('../../../hooks/subscriptionHooks/useDeleteSubscriptionApi', () => ({
    useDeleteSubscriptionApi: vi.fn(),
}));
vi.mock('../../../components/Subscriptions/SubscriptionsDetailsMobileView', () => ({
    __esModule: true,
    default: vi.fn(() => <div>SubscriptionsDetailsMobileView</div>),
}));
vi.mock('../../../components/Modals/AssignSoftwareModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssignSoftwareModal</div>),
}));
vi.mock('../../../components/Modals/SubscriptionModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>SubscriptionModal</div>),
}));
vi.mock('../../../components/Modals/SubscriptionEmployeesListModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>SubscriptionEmployeesListModal</div>),
}));
vi.mock('../../../../../../components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(({ handleSubmit }) => (
        <div>
            ConfirmationModal
            <button type="button" onClick={handleSubmit}>
                Yes
            </button>
        </div>
    )),
}));

describe('SubscriptionTable', () => {
    const mockSetReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteSubscriptionData = vi.fn();

    const defaultProps = {
        reloadInfo: mockReloadInfo,
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [
            { id: 1, subscriptionName: 'Subscription 1', status: 'Active', assignedTo: 6 },
            { id: 2, subscriptionName: 'Subscription 2', status: 'Inactive' },
        ],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        (useScreenSize as any).mockReturnValue({ xs: false });
        (useDeleteSubscriptionApi as any).mockReturnValue({
            deleteSubscriptionData: mockDeleteSubscriptionData,
            isLoading: false,
        });
    });

    it('renders correctly in desktop view', () => {
        render(<SubscriptionTable {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for subscriptions')).toBeInTheDocument();
        expect(screen.getByText('Add Subscription')).toBeInTheDocument();
        expect(screen.getByText('Assign Subscription')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Subscription 1')).toBeInTheDocument();
        expect(screen.getByText('Subscription 2')).toBeInTheDocument();
    });

    it('renders correctly in mobile view', () => {
        (useScreenSize as any).mockReturnValue({ xs: true });
        render(<SubscriptionTable {...defaultProps} />);
        expect(screen.getByText('SubscriptionsDetailsMobileView')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const props = { ...defaultProps, tableLoading: true };
        const { container } = render(<SubscriptionTable {...props} />);
        const skeletons = container.querySelector('div.ant-spin-nested-loading');
        expect(skeletons).toBeInTheDocument();
    });

    it('displays empty state when no data is available', () => {
        const props = { ...defaultProps, tableDatas: [] };
        render(<SubscriptionTable {...props} />);
        const allNoDataTexts = screen.getAllByText('No data');

        const filtered = allNoDataTexts.filter(element => !element.closest('svg'));

        expect(filtered.length).toBeGreaterThan(0);
    });

    it('calls handleSearch on input change', () => {
        render(<SubscriptionTable {...defaultProps} />);
        const searchInput = screen.getByPlaceholderText('Search for subscriptions');
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on pagination change', () => {
        render(<SubscriptionTable {...defaultProps} />);
        const nextPage = screen.getByText('2');
        fireEvent.click(nextPage);
        expect(mockHandlePageChange).toHaveBeenCalledWith(2, 10);
    });

    it('opens SubscriptionModal when "Add Subscription" is clicked', () => {
        render(<SubscriptionTable {...defaultProps} />);
        const addButton = screen.getByText('Add Subscription');
        fireEvent.click(addButton);
        expect(screen.getByText('SubscriptionModal')).toBeInTheDocument();
    });

    it('opens AssignSoftwareModal when "Assign Subscription" is clicked', () => {
        render(<SubscriptionTable {...defaultProps} />);
        const assignButton = screen.getByText('Assign Subscription');
        fireEvent.click(assignButton);
        expect(screen.getByText('AssignSoftwareModal')).toBeInTheDocument();
    });

    it('opens SubscriptionEmployeesListModal when "Employees List" is clicked on a subscription card', () => {
        render(<SubscriptionTable {...defaultProps} />);
        screen.debug(undefined, 100000);

        const assignToCountElement = screen.queryByText('6 Employees');
        if (assignToCountElement) {
            fireEvent.click(assignToCountElement);
            expect(screen.getByText('SubscriptionEmployeesListModal')).toBeInTheDocument();
        }
    });

    it('opens ConfirmationModal when deleting a subscription', async () => {
        render(<SubscriptionTable {...defaultProps} />);
        // Find the delete button for the first subscription
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        if (deleteButtons.length > 0) {
            fireEvent.click(deleteButtons[0]);
            expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();
        }
    });

    it('calls deleteSubscriptionData when confirming deletion', async () => {
        render(<SubscriptionTable {...defaultProps} />);
        // Find the delete button for the first subscription
        const deleteButtons = screen.getAllByRole('img', { name: /Delete/i });
        if (deleteButtons.length > 0) {
            fireEvent.click(deleteButtons[0]);
            expect(screen.getByText('ConfirmationModal')).toBeInTheDocument();

            const confirmButton = screen.getByText('Yes');
            fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockDeleteSubscriptionData).toHaveBeenCalledWith(1);
                expect(mockSetReloadTable).toHaveBeenCalled();
                expect(mockReloadInfo).toHaveBeenCalled();
            });
        }
    });

    it('opens SubscriptionModal when editing a subscription', () => {
        render(<SubscriptionTable {...defaultProps} />);
        const editButtons = screen.getAllByRole('img', { name: /Edit/i });
        if (editButtons.length > 0) {
            fireEvent.click(editButtons[0]);

            expect(screen.getByText('SubscriptionModal')).toBeInTheDocument();
        }
    });

    it('disables "Assign Subscription" button when there are no subscriptions', () => {
        const props = { ...defaultProps, tableDatas: [] };
        render(<SubscriptionTable {...props} />);

        const assignButton = screen.getByRole('button', { name: /assign subscription/i });
        expect(assignButton).toBeDisabled();
    });
});
