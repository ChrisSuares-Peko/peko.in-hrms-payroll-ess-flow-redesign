import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TicketInformation from '../../components/TicketInformation';
import { useDeleteTicketApi } from '../../hooks/useTicketDeleteApi';
import { useTicketUpdate } from '../../hooks/useTicketUpdateApi';

// ✅ Mock Redux Store
const mockStore = configureStore();
const store = mockStore({
    reducer: {
        support: {
            moduleDetails: [{ label: 'Module1', value: 'module1' }],
            issueDetails: [{ label: 'Issue1', value: 'issue1' }],
        },
    },
});

// ✅ Mock Redux Dispatch
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(fn => fn(store.getState())),
    useAppDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

// ✅ Mock API Hooks
vi.mock('../../hooks/useTicketDeleteApi', () => ({
    useDeleteTicketApi: vi.fn(),
}));

vi.mock('../../hooks/useTicketUpdateApi', () => ({
    useTicketUpdate: vi.fn(() => ({
        handleTicketUpdate: vi.fn(() => Promise.resolve()), // ✅ Ensure it resolves
        isLoading: false,
    })),
}));

describe('TicketInformation Component', () => {
    let mockDeleteTicket;
    let mockUpdateTicket;

    beforeEach(() => {
        mockDeleteTicket = vi.fn().mockResolvedValue(true);
        mockUpdateTicket = vi.fn().mockResolvedValue(true);

        (useDeleteTicketApi as any).mockReturnValue({
            deleteTicketData: mockDeleteTicket,
            loading: false,
        });

        (useTicketUpdate as any).mockReturnValue({
            handleTicketUpdate: mockUpdateTicket,
            isLoading: false,
        });

        vi.clearAllMocks();
    });

    const ticketData = {
        id: 123,
        status: 'Open',
        created_at: '2024-06-15T12:00:00Z',
        type: 'Bug Report',
        custom_fields: { cf_module: 'Module1' },
        attachments: [{ id: 1, attachment_url: 'https://example.com/file.png', name: '' }],
        issueType: '',
        module: '',
        screenshotImage: '',
        createdAt: '',
        chats: [
            {
                body: '',
                body_text: '',
                id: 1,
                incoming: true,
                private: true,
                user_id: 123,
                support_email: '',
                source: 234,
                category: 111,
                to_emails: [''],
                from_email: '',
                cc_emails: [''],
                bcc_emails: [''],
                email_failure_count: 11,
                outgoing_failures: 99,
                thread_id: 10,
                thread_message_id: 12,
                created_at: '', // ISO 8601 date ''
                updated_at: '', // ISO 8601 date ''
                last_edited_at: '', // ISO 8601 date string or null
                last_edited_user_id: 14,
                attachments: [], // assuming attachments can be of any type
                automation_id: 16,
                automation_type_id: 17,
                auto_response: false,
                ticket_id: 118,
                source_additional_info: '', // assuming it can be of any type or null
            },
        ],
    };

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <TicketInformation
                    chatId={123}
                    onTabChange={vi.fn()}
                    data={ticketData}
                    setReload={vi.fn()}
                />
            </Provider>
        );

    it('renders Ticket Information correctly', () => {
        renderComponent();

        expect(screen.getByText('Ticket Information')).toBeInTheDocument();
        expect(screen.getByText('Ticket ID')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Issue Type')).toBeInTheDocument();
        expect(screen.getByText('Module')).toBeInTheDocument();
        expect(screen.getByText('File Upload')).toBeInTheDocument();
    });

    it('opens delete confirmation modal when delete button is clicked', async () => {
        renderComponent();

        fireEvent.click(screen.getByTestId('delete-icon'));

        expect(
            screen.getByText(/are you sure you want to delete this ticket/i)
        ).toBeInTheDocument();
    });
});
