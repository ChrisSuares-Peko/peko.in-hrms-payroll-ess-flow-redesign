import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import EmployeeDetailsCardMobile from '../../../components/EmployeeDetails/EmployeeDetailsCardMobile';
import { formatDate } from '../../../utils/helperFunctions';

vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));

describe('EmployeeDetailsCardMobile', () => {
    const mockItem = {
        employee: 'John Doe',
        department: 'Engineering',
        joiningDate: '2023-05-15T00:00:00.000Z',
        monthlySpent: '1500',
        actions: '',
        profilePicture: 'profile.jpg',
        noOfDevices: [{ id: 1 }, { id: 2 }],
        noOfSubscriptions: [{ id: 1 }],
    };

    const handleDelete = vi.fn();
    const handleEdit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockImplementation((num: any) => `${num}`);
        (formatDate as any).mockImplementation((date: any) => date.split('T')[0]);
    });

    it('renders correctly with the provided item data', () => {
        render(
            <EmployeeDetailsCardMobile
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );
        screen.debug(undefined, 10000);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('2023-05-15')).toBeInTheDocument();
        expect(screen.queryByText('Department')).not.toBeInTheDocument();
        expect(screen.queryByText('No of Subscriptions')).not.toBeInTheDocument();
        expect(screen.queryByText('No of Devices')).not.toBeInTheDocument();
        expect(screen.queryByText('Monthly Spend')).not.toBeInTheDocument();
    });

    it('toggles details view on clicking "See More"', () => {
        render(
            <EmployeeDetailsCardMobile
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        // Initially, details should not be visible
        expect(screen.queryByText(/Department/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/No of Subscriptions/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/No of Devices/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Monthly Spend/i)).not.toBeInTheDocument();

        // Click "See More"
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should now be visible
        expect(screen.getByText(/Department/i)).toBeInTheDocument();
        expect(screen.getByText(/No of Subscriptions/i)).toBeInTheDocument();
        expect(screen.getByText(/No of Devices/i)).toBeInTheDocument();
        expect(screen.getByText(/Monthly Spend/i)).toBeInTheDocument();

        // Click "See More" again to hide details
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        // Details should be hidden
        expect(screen.queryByText(/Department/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/No of Subscriptions/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/No of Devices/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Monthly Spend/i)).not.toBeInTheDocument();
    });

    it('calls handleDelete when delete button is clicked', () => {
        render(
            <EmployeeDetailsCardMobile
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );
        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /delete/i }));
        expect(handleDelete).toHaveBeenCalledWith(mockItem);
    });

    it('calls handleEdit when edit button is clicked', () => {
        render(
            <EmployeeDetailsCardMobile
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        fireEvent.click(screen.getByRole('img', { name: /right/i }));

        fireEvent.click(screen.getByRole('img', { name: /edit/i }));
        expect(handleEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls formatDate correctly for joiningDate', () => {
        render(
            <EmployeeDetailsCardMobile
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatDate).toHaveBeenCalledWith('2023-05-15T00:00:00.000Z');
    });

    it('calls formatNumberWithLocalString correctly for monthlySpent', () => {
        render(
            <EmployeeDetailsCardMobile
                item={mockItem}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />
        );

        expect(formatNumberWithLocalString).toHaveBeenCalledWith('1500');
    });
});
