/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import useMediaStreams from '../../hooks/useMediaStreams';
import { usePeerConnection } from '../../hooks/usePeerConnection';
import useScreenShare from '../../hooks/useScreenShare';
import VideoCall from '../../pages/videoCall';

// Mock dependencies
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({
        user: { email: 'test@example.com' },
    })),
}));

vi.mock('../../hooks/usePeerConnection', () => ({
    usePeerConnection: vi.fn(),
}));

vi.mock('../../hooks/useMediaStreams', () => ({
    default: vi.fn(),
}));

vi.mock('../../hooks/useScreenShare', () => ({
    default: vi.fn(),
}));

const mockPc = {
    onconnectionstatechange: vi.fn(),
    getSenders: vi.fn(() => [{ track: { kind: 'video' }, replaceTrack: vi.fn() }]),
    ontrack: vi.fn(),
};

describe('VideoCall Component', () => {
    let mockOnEndCall: () => void;
    let mockHandleReconnection: () => Promise<void>;
    let mockHandleScreenShareToggle: () => Promise<void>;
    let mockHandleVideoToggle: () => Promise<void>;
    let mockHandleAudioToggle: () => Promise<void>;
    let mockCleanupStreams: () => void;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnEndCall = vi.fn();
        mockHandleReconnection = vi.fn();
        mockHandleScreenShareToggle = vi.fn();
        mockHandleVideoToggle = vi.fn();
        mockHandleAudioToggle = vi.fn();
        mockCleanupStreams = vi.fn();

        (usePeerConnection as unknown as Mock).mockReturnValue({
            handleReconnection: mockHandleReconnection,
        });

        (useMediaStreams as unknown as Mock).mockReturnValue({
            localStreamRef: { current: null },
            localVideoRef: { current: { srcObject: null } },
        });

        (useScreenShare as unknown as Mock).mockReturnValue({
            handleScreenShareToggle: mockHandleScreenShareToggle,
            stopScreenShare: vi.fn(),
        });
    });

    it('should render without crashing', () => {
        render(
            <VideoCall
                onEndCall={mockOnEndCall}
                pc={mockPc as unknown as RTCPeerConnection}
                callRole="caller"
                type="video"
                callerName="Alice"
                calleeName="Bob"
                calleeId="123"
            />
        );

        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should display caller/callee name correctly', () => {
        render(
            <VideoCall
                onEndCall={mockOnEndCall}
                pc={mockPc as unknown as RTCPeerConnection}
                callRole="callee"
                type="video"
                callerName="Alice"
                calleeName="Bob"
                calleeId="123"
            />
        );

        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should handle screen sharing toggle correctly', async () => {
        render(
            <VideoCall
                onEndCall={mockOnEndCall}
                pc={mockPc as unknown as RTCPeerConnection}
                callRole="caller"
                type="video"
                callerName="Alice"
                calleeName="Bob"
                calleeId="123"
            />
        );

        const screenShareButton = screen.getByRole('button', { name: /screen share/i });

        await act(async () => {
            fireEvent.click(screenShareButton);
        });

        expect(mockHandleScreenShareToggle).toHaveBeenCalled();
    });

    it('should display avatar when video is muted', async () => {
        render(
            <VideoCall
                onEndCall={mockOnEndCall}
                pc={mockPc as unknown as RTCPeerConnection}
                callRole="caller"
                type="audio"
                callerName="Alice"
                calleeName="Bob"
                calleeId="123"
            />
        );

        expect(screen.getByText('A')).toBeInTheDocument();
    });
});
