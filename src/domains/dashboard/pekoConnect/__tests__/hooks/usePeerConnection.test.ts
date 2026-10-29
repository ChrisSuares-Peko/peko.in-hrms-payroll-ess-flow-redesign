import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { usePeerConnection } from '../../hooks/usePeerConnection';

// ✅ Mock RTCPeerConnection
class MockRTCPeerConnection {
    connectionState = 'new';

    iceConnectionState = 'new';

    onicecandidate = null;

    onconnectionstatechange = null;

    createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mockSDP' });

    setLocalDescription = vi.fn().mockResolvedValue(undefined);

    close = vi.fn();

    restartIce = vi.fn();

    constructor() {
        this.connectionState = 'new';
    }
}

beforeEach(() => {
    global.RTCPeerConnection = MockRTCPeerConnection as any;
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('usePeerConnection', () => {
    it('should create a new PeerConnection', () => {
        const { result } = renderHook(() => usePeerConnection());

        act(() => {
            result.current.createPeerConnection();
        });

        expect(result.current.getPeerConnection()).not.toBeNull();
        expect(result.current.getPeerConnection()).toBeInstanceOf(MockRTCPeerConnection);
    });

    it('should not create duplicate PeerConnections', () => {
        const { result } = renderHook(() => usePeerConnection());

        act(() => {
            result.current.createPeerConnection();
            result.current.createPeerConnection(); // Should reset the first one
        });

        expect(result.current.getPeerConnection()).toBeInstanceOf(MockRTCPeerConnection);
    });

    it('should close the PeerConnection', () => {
        const { result } = renderHook(() => usePeerConnection());

        act(() => {
            result.current.createPeerConnection();
            result.current.closePeerConnection();
        });

        expect(result.current.getPeerConnection()).toBeNull();
    });

    it('should handle reconnection correctly', async () => {
        const { result } = renderHook(() => usePeerConnection());

        act(() => {
            result.current.createPeerConnection();
        });

        expect(result.current.getPeerConnection()).not.toBeNull();

        await act(async () => {
            await result.current.handleReconnection();
        });

        expect(result.current.getPeerConnection()?.restartIce).toHaveBeenCalled();
    });

    it('should create a new PeerConnection if reconnection fails', async () => {
        const { result } = renderHook(() => usePeerConnection());

        act(() => {
            result.current.createPeerConnection();
        });

        const oldPeerConnection = result.current.getPeerConnection();

        oldPeerConnection!.restartIce = vi.fn().mockImplementation(() => {
            throw new Error('Reconnection failed');
        });

        await act(async () => {
            await result.current.handleReconnection();
        });

        expect(result.current.getPeerConnection()).not.toBe(oldPeerConnection);
        expect(result.current.getPeerConnection()).toBeInstanceOf(MockRTCPeerConnection);
    });
});
