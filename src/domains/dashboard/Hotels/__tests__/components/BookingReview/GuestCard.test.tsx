import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import '@testing-library/jest-dom/vitest';
import GuestCard from '@src/domains/dashboard/Hotels/Components/BookingReview/GuestCard';

describe('GuestCard Component', () => {
    const mockPassenger = {
        FirstName: 'John',
        LastName: 'Doe',
        Email: 'john.doe@example.com',
        Phoneno: '1234567890',
        dob: '2025-03-30',
        LeadPassenger: true,
    };

    const renderComponent = (passenger = mockPassenger, index = 0, customerInfo?: any) =>
        render(<GuestCard passenger={passenger} index={index} customerInfo={customerInfo} />);

    it('renders guest index correctly', () => {
        renderComponent();

        expect(screen.getByText('Guest 1')).toBeInTheDocument();
    });

    it('renders passenger details correctly', () => {
        renderComponent();

        expect(screen.getByText(/FullName/i)).toBeInTheDocument();
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();

        expect(screen.getByText('Date of Birth')).toBeInTheDocument();
        expect(screen.getByText('2025-03-30')).toBeInTheDocument();

        expect(screen.getByText('Mobile Number')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();

        expect(screen.getByText('Email ID')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('shows N/A for guest fields when no data was collected', () => {
        const incompletePassenger = {
            FirstName: 'Jane',
            LastName: 'Doe',
            Email: '',
            Phoneno: '',
            dob: '',
            LeadPassenger: false,
        };

        renderComponent(incompletePassenger);

        expect(screen.getByText('Guest 1')).toBeInTheDocument();

        expect(screen.getByText('FullName')).toBeInTheDocument();
        expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();

        // Date of Birth, Mobile Number and Email ID all fall back to N/A.
        expect(screen.getAllByText('N/A')).toHaveLength(3);
    });

    it('falls back to the booking contact info for the lead guest', () => {
        const leadPassenger = {
            FirstName: 'Jane',
            LastName: 'Doe',
            Email: '',
            Phoneno: '',
            dob: '2025-01-01',
            LeadPassenger: true,
        };
        const customerInfo = { phone: '9876543210', emailAddress: 'jane.doe@example.com' };

        renderComponent(leadPassenger, 0, customerInfo);

        expect(screen.getByText('9876543210')).toBeInTheDocument();
        expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument();
    });

    it('does not fall back to the booking contact info for non-lead guests', () => {
        const nonLeadPassenger = {
            FirstName: 'Jane',
            LastName: 'Doe',
            Email: '',
            Phoneno: '',
            dob: '2025-01-01',
            LeadPassenger: false,
        };
        const customerInfo = { phone: '9876543210', emailAddress: 'jane.doe@example.com' };

        renderComponent(nonLeadPassenger, 1, customerInfo);

        expect(screen.getAllByText('N/A')).toHaveLength(2);
        expect(screen.queryByText('9876543210')).not.toBeInTheDocument();
        expect(screen.queryByText('jane.doe@example.com')).not.toBeInTheDocument();
    });
});
