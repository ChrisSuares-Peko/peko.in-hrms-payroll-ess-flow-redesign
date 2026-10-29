import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ChatHeader from '@src/domains/dashboard/pekoConnect/components/ChatHeader';

// Mock store hook
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        user: {
            username: 'sender-id',
        },
    })),
}));

describe('ChatHeader Component', () => {
    const mockHandleCall = vi.fn();
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });
    const defaultProps = {
        rName: 'Test Room',
        recieverId: 'receiver-id',
        sendId: 'sender-id',
        handleCall: mockHandleCall,
    };

    it('renders ChatHeader with correct recipient name and ID', () => {
        render(<ChatHeader {...defaultProps} />);

        expect(screen.getByText('Test Room')).toBeInTheDocument();
        expect(screen.getByText('Peko ID: receiver-id')).toBeInTheDocument();
    });

    it("displays the recipient's initial in the Avatar", () => {
        render(<ChatHeader {...defaultProps} />);

        // Expect avatar to contain the first letter of the recipient's name
        expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('calls handleCall when clicking the audio call button', () => {
        render(<ChatHeader {...defaultProps} />);

        const audioCallButton = screen.getByTestId('audio-call');
        fireEvent.click(audioCallButton);

        expect(mockHandleCall).toHaveBeenCalledTimes(1);
        expect(mockHandleCall).toHaveBeenCalledWith('audio');
    });

    it('calls handleCall when clicking the video call button', () => {
        render(<ChatHeader {...defaultProps} />);

        const videoCallButton = screen.getByTestId('video-call');
        fireEvent.click(videoCallButton);

        expect(mockHandleCall).toHaveBeenCalledTimes(1);
        expect(mockHandleCall).toHaveBeenCalledWith('video');
    });
});
