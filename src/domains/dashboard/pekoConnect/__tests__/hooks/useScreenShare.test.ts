import { renderHook, act } from '@testing-library/react';
import { updateDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useScreenShare from '../../hooks/useScreenShare';

vi.mock('firebase/firestore', async () => {
    const original = await vi.importActual('firebase/firestore');
    return {
        ...original,
        doc: vi.fn(),
        updateDoc: vi.fn(),
    };
});

// ✅ Helper function to create a mock `MediaStream`
const createMockMediaStream = () => ({
    getVideoTracks: vi.fn(() => [{ stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack]),
    active: true,
    id: 'mockStreamId',
    onaddtrack: null,
    onremovetrack: null,
    getAudioTracks: vi.fn(),
    getTracks: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    dispatchEvent: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    stop: vi.fn(),
    getTrackById: vi.fn(),
});

// ✅ Helper function to create a mock `RTCPeerConnection`
const createMockPeerConnection = () => ({
    getSenders: vi.fn(() => [{ track: { kind: 'video' }, replaceTrack: vi.fn() }]),
});

beforeEach(() => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
            getDisplayMedia: vi.fn().mockResolvedValue(createMockMediaStream()),
        },
        writable: true,
    });

    vi.clearAllMocks();
});

describe('useScreenShare', () => {
    let pc: RTCPeerConnection;
    let localStreamRef: React.RefObject<MediaStream | null>;
    let localVideoRef: React.RefObject<HTMLVideoElement | null>;
    let screenStreamRef: React.MutableRefObject<MediaStream | null>;
    let setVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
    let setScreenSharing: React.Dispatch<React.SetStateAction<boolean>>;

    beforeEach(() => {
        pc = createMockPeerConnection() as unknown as RTCPeerConnection;
        localStreamRef = { current: createMockMediaStream() };
        localVideoRef = { current: { srcObject: null } } as any;
        screenStreamRef = { current: null };
        setVideoMuted = vi.fn();
        setScreenSharing = vi.fn();
    });

    it('should start screen share', async () => {
        const { result } = renderHook(() =>
            useScreenShare(
                pc,
                'caller',
                localStreamRef,
                localVideoRef,
                screenStreamRef,
                setVideoMuted,
                setScreenSharing,
                false,
                'callee123'
            )
        );

        await act(async () => {
            await result.current.startScreenShare();
        });

        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
        expect(updateDoc).toHaveBeenCalled();
        expect(setScreenSharing).toHaveBeenCalledWith(true);
        expect(localVideoRef.current?.srcObject).not.toBeNull();
    });

    it('should stop screen share', async () => {
        const { result } = renderHook(() =>
            useScreenShare(
                pc,
                'caller',
                localStreamRef,
                localVideoRef,
                screenStreamRef,
                setVideoMuted,
                setScreenSharing,
                false,
                'callee123'
            )
        );

        // ✅ Ensure screenStreamRef.current is properly mocked before calling stopScreenShare
        screenStreamRef.current = {
            ...createMockMediaStream(),
            getTracks: vi.fn(() => [
                { stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack,
            ]),
        };

        await act(async () => {
            await result.current.stopScreenShare();
        });

        expect(updateDoc).toHaveBeenCalled();
        expect(setScreenSharing).toHaveBeenCalledWith(false);
        expect(screenStreamRef.current).toBeNull();
        expect(localVideoRef.current?.srcObject).toBe(localStreamRef.current);
    });

    it('should toggle screen share on and off', async () => {
        const { result } = renderHook(() =>
            useScreenShare(
                pc,
                'caller',
                localStreamRef,
                localVideoRef,
                screenStreamRef,
                setVideoMuted,
                setScreenSharing,
                false,
                'callee123'
            )
        );

        await act(async () => {
            await result.current.handleScreenShareToggle();
        });

        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
        expect(setScreenSharing).toHaveBeenCalledWith(true);

        screenStreamRef.current = {
            ...createMockMediaStream(),
            getTracks: vi.fn(() => [
                { stop: vi.fn(), kind: 'video' } as unknown as MediaStreamTrack,
            ]),
        };

        await act(async () => {
            await result.current.handleScreenShareToggle();
        });

        expect(updateDoc).toHaveBeenCalled();
        expect(setScreenSharing).toHaveBeenCalledWith(false);
    });

    it('should handle errors in startScreenShare gracefully', async () => {
        (navigator.mediaDevices.getDisplayMedia as any).mockRejectedValue(
            new Error('Screen share error')
        );

        const { result } = renderHook(() =>
            useScreenShare(
                pc,
                'caller',
                localStreamRef,
                localVideoRef,
                screenStreamRef,
                setVideoMuted,
                setScreenSharing,
                false,
                'callee123'
            )
        );

        await act(async () => {
            await result.current.startScreenShare();
        });

        expect(setScreenSharing).not.toHaveBeenCalled();
    });
});
