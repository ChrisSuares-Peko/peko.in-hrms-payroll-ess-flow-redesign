import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TicketsMobile from '../../components/TicketsMobile';
import { ticketListingTableData } from '../../types/type';

describe('TicketsMobile Component', () => {
    const mockHandleButtonClick = vi.fn();

    const mockData: ticketListingTableData[] = [
        {
            ticketId: 123,
            date: '2024-06-15',
            module: 'Finance',
            status: 'Open',
            issueType: '',
            id: 0,
            view: '',
        },
        {
            ticketId: 345,
            date: '2024-06-16',
            module: 'IT Support',
            status: 'Closed',
            issueType: '',
            id: 0,
            view: '',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <TicketsMobile
                data={mockData}
                handleButtonClick={mockHandleButtonClick}
                isLoading={false}
            />
        );

        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Module')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('displays tickets correctly', () => {
        render(
            <TicketsMobile
                data={mockData}
                handleButtonClick={mockHandleButtonClick}
                isLoading={false}
            />
        );

        expect(screen.getByText('Finance')).toBeInTheDocument();
        expect(screen.getByText('IT Support')).toBeInTheDocument();
        expect(screen.getByText('Open')).toBeInTheDocument();
        expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('displays loading skeleton when `isLoading` is true', () => {
        render(<TicketsMobile data={[]} handleButtonClick={mockHandleButtonClick} isLoading />);

        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Module')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('displays empty state when no tickets are available', () => {
        render(
            <TicketsMobile data={[]} handleButtonClick={mockHandleButtonClick} isLoading={false} />
        );

        expect(screen.getByText('No Tickets')).toBeInTheDocument();
    });
});
