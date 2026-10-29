import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SubscriptionsDetailsMobileView from '../../../components/Subscriptions/SubscriptionsDetailsMobileView';
import { useDeleteSubscriptionApi } from '../../../hooks/subscriptionHooks/useDeleteSubscriptionApi';

vi.mock('../../../hooks/subscriptionHooks/useDeleteSubscriptionApi', () => ({
    useDeleteSubscriptionApi: vi.fn(),
}));
vi.mock('../../../components/Subscription/SubscriptionsDetailsMobileCard', () => ({
    __esModule: true,
    default: vi.fn(() => <div>SubscriptionDetailsMobileCard</div>),
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
vi.mock('@components/molecular/modals/ConfirmationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ConfirmationModal</div>),
}));

describe('SubscriptionsDetailsMobileView', () => {
    const mockSetReloadTable = vi.fn();
    const mockReloadInfo = vi.fn();
    const mockHandleSearch = vi.fn();
    const mockHandlePageChange = vi.fn();
    const mockDeleteSubscriptionData = vi.fn();

    const defaultProps = {
        searchText: '',
        setReloadTable: mockSetReloadTable,
        orderCount: 100,
        tableLoading: false,
        tableDatas: [{ id: 1, subscriptionName: 'Subscription 1', status: 'Active' }],
        handleSearch: mockHandleSearch,
        handlePageChange: mockHandlePageChange,
        page: 1,
        limit: 10,
        reloadInfo: mockReloadInfo,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteSubscriptionApi as any).mockReturnValue({
            deleteSubscriptionData: mockDeleteSubscriptionData,
            isLoading: false,
        });
    });

    it('renders the component correctly', () => {
        render(<SubscriptionsDetailsMobileView {...defaultProps} />);
        expect(screen.getByPlaceholderText('Search for subscriptions')).toBeInTheDocument();
        expect(screen.getByText('Add Subscription')).toBeInTheDocument();
        expect(screen.getByText('Assign Subscription')).toBeInTheDocument();
        expect(screen.getByText('Subscription Name')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('calls handleSearch on input change', () => {
        render(<SubscriptionsDetailsMobileView {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText('Search for subscriptions'), {
            target: { value: 'new search' },
        });
        expect(mockHandleSearch).toHaveBeenCalled();
    });

    it('calls handlePageChange on page change', () => {
        render(<SubscriptionsDetailsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('2'));
        expect(mockHandlePageChange).toHaveBeenCalled();
    });

    it('opens SubscriptionModal when "Add Subscription" is clicked', () => {
        render(<SubscriptionsDetailsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Add Subscription'));
        expect(screen.getByText('SubscriptionModal')).toBeInTheDocument();
    });

    it('opens AssignSoftwareModal when "Assign Subscription" is clicked', () => {
        render(<SubscriptionsDetailsMobileView {...defaultProps} />);
        fireEvent.click(screen.getByText('Assign Subscription'));
        expect(screen.getByText('AssignSoftwareModal')).toBeInTheDocument();
    });

    it('displays loading skeleton when tableLoading is true', () => {
        const { container } = render(
            <SubscriptionsDetailsMobileView {...defaultProps} tableLoading />
        );
        const skeletons = container.querySelectorAll('.ant-skeleton-paragraph');
        expect(skeletons.length).toBe(10);
    });

    it('displays empty state when no data is available', () => {
        render(<SubscriptionsDetailsMobileView {...defaultProps} tableDatas={[]} />);
        expect(screen.getByText('No data available')).toBeInTheDocument();
    });
});
