import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ChatList from '@src/domains/dashboard/pekoConnect/components/ChatList';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        corporateId: 'corp123',
        user: {
            email: 'testuser@example.com',
            username: 'testuser',
        },
    })),
}));

describe('ChatList Component', () => {
    let mockSetRequest: any;
    let mockSetChatId: any;
    let mockSetRname: any;
    let mockSetRecieverId: any;
    let mockSetSendId: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetRequest = vi.fn();
        mockSetChatId = vi.fn();
        mockSetRname = vi.fn();
        mockSetRecieverId = vi.fn();
        mockSetSendId = vi.fn();
    });

    const defaultProps = {
        requests: [
            {
                id: '1',
                senderName: 'John Doe',
                senderUsername: 'john_doe',
                receiverName: 'Jane Smith',
                message: 'Connection request message',
                createdAt: { seconds: 1707800000 }, // Example timestamp
            },
        ],
        setRequest: mockSetRequest,
        chatId: null,
        setChatId: mockSetChatId,
        setRname: mockSetRname,
        queryString: '',
        setRecieverId: mockSetRecieverId,
        setSendId: mockSetSendId,
    };

    it('renders ChatList component with pending requests', () => {
        render(<ChatList {...defaultProps} />);

        expect(screen.getByText('1 Pending Connection Request')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Connection request message')).toBeInTheDocument();
    });

    it('renders no pending requests when the list is empty', () => {
        render(<ChatList {...defaultProps} requests={[]} />);

        expect(screen.getByText('No Pending Connection Requests')).toBeInTheDocument();
    });

    it('shows "No Connections Found" when no connections exist', () => {
        render(<ChatList {...defaultProps} requests={[]} />);

        expect(screen.getByText('No Connections Found')).toBeInTheDocument();
    });
});
