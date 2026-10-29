import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import CustomModal from '../../components/CustomModal';

vi.mock('../../hooks/useTicketCreate', () => ({
    default: vi.fn(() => ({ handleTicketCreation: vi.fn(), isLoading: false })),
}));

vi.mock('@src/hooks/store', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useAppSelector: vi.fn(() => ({
            moduleDetails: [],
            issueDetails: [],
        })),
        useAppDispatch: vi.fn(() => vi.fn()), // Mock dispatch function
    };
});

describe('CustomModal Component', () => {
    let closeModalMock: any;
    let getTicketListMock: any;

    beforeEach(() => {
        closeModalMock = vi.fn();
        getTicketListMock = vi.fn();
    });

    it('renders the modal with correct title', () => {
        render(
            <BrowserRouter>
                <CustomModal open closeModal={closeModalMock} getTicketList={getTicketListMock} />
            </BrowserRouter>
        );

        expect(screen.getByText(/Raise A Ticket/i)).toBeInTheDocument();
    });

    it('closes the modal when cancel button is clicked', () => {
        render(
            <BrowserRouter>
                <CustomModal open closeModal={closeModalMock} getTicketList={getTicketListMock} />
            </BrowserRouter>
        );

        const closeButton = screen.getByText(/Cancel/i);
        fireEvent.click(closeButton);

        expect(closeModalMock).toHaveBeenCalled();
    });
});
