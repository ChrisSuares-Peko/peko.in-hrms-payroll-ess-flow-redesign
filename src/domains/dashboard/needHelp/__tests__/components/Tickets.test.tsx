import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Tickets from '../../components/Tickets';

const mockStore = configureStore();
const initialStore = {
    reducer: {
        auth: {
            role: 'admin',
            id: 123,
        },
        support: {
            moduleDetails: [{ label: 'Module1', value: 'module1' }],
            issueDetails: [{ label: 'Issue1', value: 'issue1' }],
        },
    },
};

// ✅ Mock useAppSelector
vi.mock('@src/hooks/store', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useAppSelector: vi.fn(selector => selector(initialStore)),
    };
});

// ✅ Mock API Hooks
vi.mock('../../hooks/useTicketListingApi', () => ({
    useTicketListingApi: vi.fn(() => ({
        data: [
            {
                id: 'TKT001',
                date: '2024-06-15T12:00:00Z',
                ticketId: '12345',
                issueType: 'Bug',
                module: 'Module1',
                description: '<p>Issue details here</p>',
                status: 'OPEN',
            },
        ],
        count: 1,
        isLoading: false,
        getTicketList: vi.fn(),
    })),
}));

vi.mock('../../hooks/useFilter', async importOriginal => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        useFilter: vi.fn(() => ({
            handleChangeModule: vi.fn(),
            handlePageChange: vi.fn(),
            handleDateChange: vi.fn(),
            handleFromChange: vi.fn(),
            handleToChange: vi.fn(),
        })),
    };
});

vi.mock('../../hooks/useModuleApi', () => ({
    useGetModuleListingType: vi.fn(() => ({
        moduleTypes: [{ value: 'module1', label: 'Module 1' }],
        isLoading: false,
    })),
}));

vi.mock('../../hooks/useIssueTypeApi', () => ({
    useGetIssueListingType: vi.fn(() => ({
        isLoading: false,
    })),
}));

describe('Tickets Component', () => {
    let store: any;
    let mockHandleButtonClick: any;
    let mockSetShouldRefreshTickets: any;

    beforeEach(() => {
        store = mockStore(initialStore);
        mockHandleButtonClick = vi.fn();
        mockSetShouldRefreshTickets = vi.fn();
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <Tickets
                        handleButtonClick={mockHandleButtonClick}
                        shouldRefreshTickets={false}
                        setShouldRefreshTickets={mockSetShouldRefreshTickets}
                    />
                </BrowserRouter>
            </Provider>
        );

    it('renders the component correctly', () => {
        renderComponent();

        expect(screen.getByText('Tickets')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /raise a ticket/i })).toBeInTheDocument();
        expect(screen.getByText('Bug')).toBeInTheDocument();
        expect(screen.getByText('Module1')).toBeInTheDocument();
    });

    it('opens the modal when "Raise A Ticket" button is clicked', () => {
        renderComponent();

        const buttons = screen.getAllByText('Raise A Ticket');
        expect(buttons.length).toBeGreaterThan(0); // Ensure at least one exists
        fireEvent.click(buttons[0]); // Click the first "Raise A Ticket" button
    });

    it('displays correct data in the table', () => {
        renderComponent();

        expect(screen.getByText('12345')).toBeInTheDocument();
        expect(screen.getByText('Bug')).toBeInTheDocument();
        expect(screen.getByText('Module1')).toBeInTheDocument();
    });
});
