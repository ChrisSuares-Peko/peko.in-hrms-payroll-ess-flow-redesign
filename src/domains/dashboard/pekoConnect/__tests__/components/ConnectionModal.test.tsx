import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import ConnectionModal from '@src/domains/dashboard/pekoConnect/components/ConnectionModal';

import usePostRequest from '../../hooks/usePostRequest';

vi.mock('../../hooks/usePostRequest', () => ({
    default: vi.fn(() => ({
        handlePostRequest: vi.fn(() => Promise.resolve()), // Ensure it's a mock function
        isLoading: false,
    })),
}));

vi.mock('../../hooks/useGetCorporates', () => ({
    useGetCorporates: vi.fn(() => ({
        corporates: [{ value: '1', label: 'Test Corp' }], // Mocked corporate data
        isLoading: false,
    })),
}));

describe('ConnectionModal Component', () => {
    let mockOnCancel: any;
    let mockRefresh: any;
    let mockHandlePostRequest: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockOnCancel = vi.fn();
        mockRefresh = vi.fn();
        mockHandlePostRequest = vi.fn().mockResolvedValue({});

        // Correctly mock `usePostRequest`
        (usePostRequest as Mock).mockReturnValue({
            handlePostRequest: mockHandlePostRequest,
            isLoading: false,
        });
    });

    const defaultProps = {
        visible: true,
        onCancel: mockOnCancel,
        refresh: mockRefresh,
    };

    it('renders modal when visible', () => {
        render(<ConnectionModal {...defaultProps} />);
        expect(screen.getByText('Invite a connection')).toBeInTheDocument();
        expect(screen.getByText('Enter company Name or Peko ID')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter message')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('disables send button when required fields are empty', async () => {
        render(<ConnectionModal {...defaultProps} />);
        const sendButton = screen.getByRole('button', { name: /Send/i });

        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(mockHandlePostRequest).not.toHaveBeenCalled();
        });
    });

    it('validates message input correctly', async () => {
        render(<ConnectionModal {...defaultProps} />);

        const messageInput = screen.getByPlaceholderText('Enter message');
        fireEvent.change(messageInput, { target: { value: '' } });

        fireEvent.click(screen.getByRole('button', { name: /Send/i }));

        await waitFor(() => {
            expect(screen.getByText('Please enter a message')).toBeInTheDocument();
        });
    });

    //   it('calls handlePostRequest and refreshes when form is submitted', async () => {
    //     render(<ConnectionModal {...defaultProps} />);

    //     // Select a company
    //     fireEvent.mouseDown(screen.getByRole('combobox'));
    //     fireEvent.click(await screen.findByText('Test Corp'));

    //     // Enter message
    //     fireEvent.change(screen.getByPlaceholderText('Enter message'), {
    //         target: { value: 'Hello, please connect' },
    //     });

    //     fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    //     await waitFor(() => {
    //         expect(mockHandlePostRequest).toHaveBeenCalledWith({
    //             receiverId: '1',
    //             message: 'Hello, please connect',
    //         });
    //         expect(mockRefresh).toHaveBeenCalled();
    //         expect(mockOnCancel).toHaveBeenCalled();
    //     });
    // });

    //   it('calls onCancel when cancel button is clicked', () => {
    //       render(<ConnectionModal {...defaultProps} />);

    //       fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    //       expect(mockOnCancel).toHaveBeenCalled();
    //   });

    it('handles corporate search correctly', async () => {
        render(<ConnectionModal {...defaultProps} />);

        const input = screen.getByRole('combobox');
        fireEvent.change(input, { target: { value: 'Test' } });

        expect(await screen.findByText('Test Corp')).toBeInTheDocument();
    });
});
