import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

import CallControls from '../../components/CallControls';

describe('CallControls Component', () => {
    const mockHandleAudioToggle = vi.fn();
    const mockHandleVideoToggle = vi.fn();
    const mockHandleScreenShareToggle = vi.fn();
    const mockOnEndCall = vi.fn();
    const mockCleanupStreams = vi.fn();

    const renderComponent = (props = {}) =>
        render(
            <CallControls
                audioMuted={false}
                videoMuted={false}
                screenSharing={false}
                type="video"
                handleAudioToggle={mockHandleAudioToggle}
                handleVideoToggle={mockHandleVideoToggle}
                handleScreenShareToggle={mockHandleScreenShareToggle}
                onEndCall={mockOnEndCall}
                cleanupStreams={mockCleanupStreams}
                {...props}
            />
        );

    it('should render all buttons for video call type', () => {
        renderComponent();

        expect(screen.getByTitle('Turn Off Microphone')).toBeInTheDocument();
        expect(screen.getByTitle('Turn Off Camera')).toBeInTheDocument();
        expect(screen.getByTitle('Start Screen Share')).toBeInTheDocument();
        expect(screen.getByTitle('Disconnect Call')).toBeInTheDocument();
    });

    it('should render only audio and disconnect buttons for audio call type', () => {
        renderComponent({ type: 'audio' });

        expect(screen.getByTitle('Turn Off Microphone')).toBeInTheDocument();
        expect(screen.queryByTitle('Turn Off Camera')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Start Screen Share')).not.toBeInTheDocument();
        expect(screen.getByTitle('Disconnect Call')).toBeInTheDocument();
    });

    it('should toggle audio when clicking the microphone button', () => {
        renderComponent();

        const micButton = screen.getByTitle('Turn Off Microphone');
        fireEvent.click(micButton);

        expect(mockHandleAudioToggle).toHaveBeenCalledTimes(1);
    });

    it('should toggle video when clicking the camera button (video calls only)', () => {
        renderComponent();

        const videoButton = screen.getByTitle('Turn Off Camera');
        fireEvent.click(videoButton);

        expect(mockHandleVideoToggle).toHaveBeenCalledTimes(1);
    });

    it('should toggle screen sharing when clicking the screen share button (video calls only)', () => {
        renderComponent();

        const screenShareButton = screen.getByTitle('Start Screen Share');
        fireEvent.click(screenShareButton);

        expect(mockHandleScreenShareToggle).toHaveBeenCalledTimes(1);
    });

    it('should call cleanupStreams and onEndCall when disconnect button is clicked', () => {
        renderComponent();

        const disconnectButton = screen.getByTitle('Disconnect Call');
        fireEvent.click(disconnectButton);

        expect(mockCleanupStreams).toHaveBeenCalledTimes(1);
        expect(mockOnEndCall).toHaveBeenCalledTimes(1);
    });

    it('should display correct microphone icon based on audioMuted state', () => {
        renderComponent({ audioMuted: true });

        expect(screen.getByTitle('Turn On Microphone')).toBeInTheDocument();
    });

    it('should display correct video icon based on videoMuted state', () => {
        renderComponent({ videoMuted: true });

        expect(screen.getByTitle('Turn On Camera')).toBeInTheDocument();
    });

    it('should display correct screen share icon based on screenSharing state', () => {
        renderComponent({ screenSharing: true });

        expect(screen.getByTitle('Stop Screen Share')).toBeInTheDocument();
    });
});
