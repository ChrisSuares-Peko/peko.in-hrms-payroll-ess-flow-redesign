import { renderHook, act } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import useCleanupStreams from '../../hooks/useCleanupStreams';

// ✅ Step 1: Mock track objects properly
const createMockTrack = (id: string) => {
    const track = {
        id,
        stop: vi.fn(), // ✅ Persisted spy function
        readyState: 'live',
    };
    return track;
};

// ✅ Step 2: Ensure `getTracks()` always returns valid mock tracks
const track1 = createMockTrack('track1');
const track2 = createMockTrack('track2');

const createMockStream = (id: string, active = true) => ({
    id,
    active,
    getTracks: vi.fn(() => [track1, track2]), // ✅ Always returns the same tracks
});

// ✅ Step 3: Ensure `getSenders()` correctly returns valid tracks
const sender1 = { track: createMockTrack('senderTrack1') };
const sender2 = { track: createMockTrack('senderTrack2') };

const createMockPeerConnection = () => ({
    close: vi.fn(),
    getSenders: vi.fn(() => [sender1, sender2]), // ✅ Always returns the same senders
});

beforeAll(() => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
            getUserMedia: vi.fn().mockResolvedValue({
                getTracks: vi.fn(() => [createMockTrack('mic'), createMockTrack('camera')]),
            }),
        },
        writable: true,
    });
});

describe('useCleanupStreams', () => {
    let pc: RTCPeerConnection;
    let localVideoRef: React.RefObject<HTMLVideoElement>;
    let remoteVideoRef: React.RefObject<HTMLVideoElement>;

    beforeEach(() => {
        vi.clearAllMocks();
        pc = createMockPeerConnection() as unknown as RTCPeerConnection;

        localVideoRef = {
            current: {
                srcObject: createMockStream('localStream'),
                pause: vi.fn(),
            },
        } as unknown as React.RefObject<HTMLVideoElement>;

        remoteVideoRef = {
            current: {
                srcObject: createMockStream('remoteStream'),
                pause: vi.fn(),
            },
        } as unknown as React.RefObject<HTMLVideoElement>;
    });

    it('stops all tracks and clears video elements', () => {
        const { result } = renderHook(() => useCleanupStreams(pc, localVideoRef, remoteVideoRef));

        act(() => {
            result.current();
        });

        // ✅ Ensure tracks were stopped
        expect(track1.stop).toHaveBeenCalled();
        expect(track2.stop).toHaveBeenCalled();

        // ✅ Ensure srcObject is cleared and videos paused
        expect(localVideoRef.current?.pause).toHaveBeenCalled();
        expect(remoteVideoRef.current?.pause).toHaveBeenCalled();
        expect(localVideoRef.current?.srcObject).toBeNull();
        expect(remoteVideoRef.current?.srcObject).toBeNull();
    });

    it('closes the RTCPeerConnection and stops senders', () => {
        const { result } = renderHook(() => useCleanupStreams(pc, localVideoRef, remoteVideoRef));

        act(() => {
            result.current();
        });

        // ✅ Ensure PeerConnection senders' tracks were stopped
        expect(pc.getSenders).toHaveBeenCalled();
        expect(sender1.track.stop).toHaveBeenCalled();
        expect(sender2.track.stop).toHaveBeenCalled();
        expect(pc.close).toHaveBeenCalled();
    });

    it('handles missing video streams gracefully', () => {
        localVideoRef.current!.srcObject = null;
        remoteVideoRef.current!.srcObject = null;

        const { result } = renderHook(() => useCleanupStreams(pc, localVideoRef, remoteVideoRef));

        act(() => {
            result.current();
        });

        // If there's no srcObject, pause should not be called
        expect(localVideoRef.current!.pause).not.toHaveBeenCalled();
        expect(remoteVideoRef.current!.pause).not.toHaveBeenCalled();
    });

    it('releases media devices properly', async () => {
        const { result } = renderHook(() => useCleanupStreams(pc, localVideoRef, remoteVideoRef));

        await act(async () => {
            result.current();
        });

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
            audio: true,
            video: true,
        });
    });
});
