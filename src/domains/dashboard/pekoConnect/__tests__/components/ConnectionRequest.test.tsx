import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import ConnectionRequest from '@src/domains/dashboard/pekoConnect/components/ConnectionRequest';
import usePutRequest from '@src/domains/dashboard/pekoConnect/hooks/usePutRequest';
import { useAppSelector } from '@src/hooks/store';

vi.mock('@src/domains/dashboard/pekoConnect/hooks/usePutRequest', () => ({
    default: vi.fn(),
    usePutRequest: vi.fn(() => ({
        handlePutRequest: vi.fn(() => Promise.resolve()),
        isLoading: false,
    })),
}));
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
}));

beforeEach(() => {
    (useAppSelector as Mock).mockReturnValue({ auth: { email: 'test@example.com' } });
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize')); // Trigger resize event
});

describe('ConnectionRequest Component', () => {
    let mockSetChatId: Mock<(chatId: string) => void>;
    let mockSetRequest: Mock<(...args: any[]) => any>;
    let mockRefresh: Mock<() => void>;
    let mockOnClose: Mock<(...args: any[]) => any>;
    let mockHandlePutRequest: Mock<(...args: any[]) => any>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetChatId = vi.fn();
        mockSetRequest = vi.fn();
        mockRefresh = vi.fn();
        mockOnClose = vi.fn();
        mockHandlePutRequest = vi.fn().mockResolvedValue({});

        vi.mocked(usePutRequest).mockReturnValue({
            handlePutRequest: mockHandlePutRequest,
            isLoading: false,
        });
    });

    let defaultProps: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetChatId = vi.fn();
        mockSetRequest = vi.fn();
        mockRefresh = vi.fn();
        mockOnClose = vi.fn();
        mockHandlePutRequest = vi.fn().mockResolvedValue({});

        vi.mocked(usePutRequest).mockReturnValue({
            handlePutRequest: mockHandlePutRequest,
            isLoading: false,
        });

        defaultProps = {
            request: {
                id: '123',
                senderId: 'corp-1',
                receiverId: 'corp-2',
                senderName: 'Sender Corp',
                receiverName: 'Receiver Corp',
                senderUsername: 'sender123',
                receiverUsername: 'receiver123',
                message: 'Hello, let’s connect!',
            },
            setChatId: mockSetChatId,
            setRequest: mockSetRequest,
            refresh: mockRefresh,
            onClose: mockOnClose,
        };
    });

    it('renders request details correctly', () => {
        render(<ConnectionRequest {...defaultProps} />);
        expect(screen.getByText('Sender Corp wants to connect')).toBeInTheDocument();
        expect(screen.getByText('Sender Corp: Hello, let’s connect!')).toBeInTheDocument();
    });

    it('calls handleAccept when Start conversation is clicked', async () => {
        render(<ConnectionRequest {...defaultProps} />);

        fireEvent.click(screen.getByText('Start conversation'));

        await waitFor(() => {
            expect(mockHandlePutRequest).toHaveBeenCalledWith({
                requestId: '123',
                status: 'ACCEPTED',
            });
        });
    });

    it('calls handleReject when Reject is clicked', async () => {
        render(<ConnectionRequest {...defaultProps} />);

        fireEvent.click(screen.getByText('Reject'));

        await waitFor(() => {
            expect(mockHandlePutRequest).toHaveBeenCalledWith({
                requestId: '123',
                status: 'REJECTED',
            });
            expect(mockSetRequest).toHaveBeenCalledWith('');
        });
    });

    it('calls onClose when back button is clicked', () => {
        render(<ConnectionRequest {...defaultProps} />);
        screen.debug();

        const backButton = screen.getByRole('button', { name: /arrow-left/i });

        fireEvent.click(backButton);

     
        expect(mockOnClose).toHaveBeenCalled();
    });
});
