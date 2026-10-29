import { render, screen, fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import TableMobile from '../../components/TableMobile';

const mockTicket = {
    date: dayjs().toISOString(),
    status: 'SUCCESS',
    module: 'Support',
    ticketId: 123,
    issueType: '',
    id: 1,
    view: '',
};

const handleButtonClickMock = vi.fn();

describe('TableMobile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders ticket details correctly', () => {
        render(
            <BrowserRouter>
                <TableMobile ticket={mockTicket} handleButtonClick={handleButtonClickMock} />
            </BrowserRouter>
        );

        expect(screen.getByText(dayjs(mockTicket.date).format('DD-MM-YYYY'))).toBeInTheDocument();
        expect(screen.getByText(mockTicket.module)).toBeInTheDocument();
        expect(screen.getByText(mockTicket.status)).toBeInTheDocument();
    });

    it('toggles more details when clicking arrow icon', () => {
        render(
            <BrowserRouter>
                <TableMobile ticket={mockTicket} handleButtonClick={handleButtonClickMock} />
            </BrowserRouter>
        );

        const arrowIcon = screen.getByRole('img', { name: /right/i });
        fireEvent.click(arrowIcon);

        expect(screen.getByText(/Ticket ID/i)).toBeInTheDocument();
        expect(screen.getByText(/Issue Details/i)).toBeInTheDocument();
    });
});
