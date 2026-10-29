/* eslint-disable @typescript-eslint/no-unused-vars */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import useMediaStreams from '../../hooks/useMediaStreams';

beforeAll(() => {
    global.MediaStream = class {
        active = true;

        id = 'mock-stream';

        onaddtrack = null;

        onremovetrack = null;

        getAudioTracks = vi.fn(() => []);

        getVideoTracks = vi.fn(() => []);

        getTracks = vi.fn(() => []);

        addTrack = vi.fn();

        removeTrack = vi.fn();

        clone = vi.fn(() => new MediaStream());
    } as any;

    Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
            getUserMedia: vi.fn().mockResolvedValue(new MediaStream()), // ✅ Always returns a valid MediaStream
        },
        writable: true,
    });
});

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
describe('useMediaStreams', () => {
    afterEach(() => {
        vi.clearAllMocks();
        cleanup();
    });
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
    it('should request video and audio for video calls', async () => {
        const { result } = renderHook(() => useMediaStreams(pc, 'video'));

        await act(async () => {});

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
            audio: true,
            video: true,
        });

        expect(result.current.localStreamRef.current).not.toBeNull();
    });

    it('should request only audio for audio calls', async () => {
        const { result } = renderHook(() => useMediaStreams(pc, 'audio'));

        await act(async () => {});

        expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
            audio: true,
        });

        expect(result.current.localStreamRef.current).not.toBeNull();
    });

    it('should set the video element srcObject when available', async () => {
        const { result } = renderHook(() => useMediaStreams(pc, 'video'));

        await act(async () => {});

        if (result.current.localVideoRef.current) {
            expect(result.current.localVideoRef.current.srcObject).not.toBeNull();
        }
    });

    it('should clean up and stop all tracks on unmount', async () => {
        const { result, unmount } = renderHook(() => useMediaStreams(pc, 'video'));

        await act(async () => {});

        expect(result.current.localStreamRef.current).not.toBeNull();

        const mockTracks = result.current.localStreamRef.current!.getTracks();

        unmount();

        mockTracks.forEach(track => expect(track.stop).toHaveBeenCalled());

        expect(result.current.localStreamRef.current).toBeNull();
    });
});
