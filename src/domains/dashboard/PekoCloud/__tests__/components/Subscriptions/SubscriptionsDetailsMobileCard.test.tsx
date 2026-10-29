import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import SubscriptionsDetailsMobileCard from '../../../components/Subscriptions/SubscriptionsDetailsMobileCard';
import { formatText } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', () => ({
    formatText: vi.fn(),
}));

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

describe('SubscriptionsDetailsMobileCard', () => {
    const mockItem = {
        subscriptionName: 'Premium Plan',
        planDetails: 'Annual subscription',
        status: 'Active',
        billingStartDate: '2023-01-01T00:00:00.000Z',
        billingCycle: 'Annual',
        assignedTo: 3,
        numberOfDevices: '5',
        actions: '',
        amount: '1200',
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();
    const handleEmployeesList = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockImplementation((num: any) => `${num}`);
        (formatText as any).mockImplementation((text: any) => text);
    });

    it('renders correctly with the provided item data', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        expect(screen.getByText('Premium Plan')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('Plan Details')).not.toBeInTheDocument();
        expect(screen.queryByText('Billing Start Date')).not.toBeInTheDocument();
        expect(screen.queryByText('Billing Cycle')).not.toBeInTheDocument();
        expect(screen.queryByText('Assigned to')).not.toBeInTheDocument();
        expect(screen.queryByText('No of Users')).not.toBeInTheDocument();
        expect(screen.queryByText('Amount')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Plan Details/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Billing Start Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Billing Cycle/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assigned to/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/No of Users/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Plan Details/i)).toBeInTheDocument();
        expect(screen.getByText(/Billing Start Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Billing Cycle/i)).toBeInTheDocument();
        expect(screen.getByText(/Assigned to/i)).toBeInTheDocument();
        expect(screen.getByText(/No of Users/i)).toBeInTheDocument();
        expect(screen.getByText(/Amount/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Plan Details/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Billing Start Date/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Billing Cycle/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Assigned to/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/No of Users/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Amount/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleEdit when edit button is clicked', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));
        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleEmployeesList when eye button is clicked', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /eye/i }));
        expect(handleEmployeesList).toHaveBeenCalledWith(mockItem);
    });

    it('calls formatText correctly for status', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        expect(formatText).toHaveBeenCalledWith('Active');
    });

    it('calls formatNumberWithLocalString correctly for amount', () => {
        render(
            <SubscriptionsDetailsMobileCard
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleEmployeesList={handleEmployeesList}
            />
        );

        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1200');
    });
});
