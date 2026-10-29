import { renderHook } from '@testing-library/react';
import { onSnapshot, doc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { firestore } from '../../config/firebaseConfig';
import useCallStatus from '../../hooks/useCallStatus';

vi.mock('firebase/firestore', async () => {
    const original = await vi.importActual('firebase/firestore');

    return {
        ...original,
        collection: vi.fn(),
        doc: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        serverTimestamp: vi.fn(),
        onSnapshot: vi.fn(
            () => () => {} // Mock unsubscribe function
        ),
    };
});

describe('useCallStatus', () => {
    let cleanupStreams: () => void;
    let onEndCall: () => void;
    let unsubscribeMock: () => void;

    beforeEach(() => {
        vi.clearAllMocks();
        cleanupStreams = vi.fn();
        onEndCall = vi.fn();
        unsubscribeMock = vi.fn();

        (doc as Mock).mockReturnValue({});
        (onSnapshot as Mock).mockImplementation((_docRef, callback) => {
            callback({
                data: () => ({
                    callerVideoMuted: false,
                    calleeVideoMuted: false,
                    callerScreenShareMuted: true,
                    calleeScreenShareMuted: true,
                    type: 'video',
                    status: 'active',
                }),
            });
            return unsubscribeMock;
        });
    });

    it('subscribes to Firestore and updates state correctly', async () => {
        const { result } = renderHook(() =>
            useCallStatus('123', cleanupStreams, onEndCall, 'video')
        );

        expect(result.current.isCallerVideoMuted).toBe(false);
        expect(result.current.isCalleeVideoMuted).toBe(false);
        expect(result.current.isCallerScreenShareMuted).toBe(true);
        expect(result.current.isCalleeScreenShareMuted).toBe(true);

        expect(doc).toHaveBeenCalledWith(firestore, 'calls', '123');
        expect(onSnapshot).toHaveBeenCalled();
    });

    it('calls cleanupStreams and onEndCall when call ends', async () => {
        (onSnapshot as Mock).mockImplementation((_docRef, callback) => {
            callback({
                data: () => ({
                    status: 'ended',
                }),
            });
            return unsubscribeMock;
        });

        renderHook(() => useCallStatus('123', cleanupStreams, onEndCall, 'video'));

        expect(cleanupStreams).toHaveBeenCalled();
        expect(onEndCall).toHaveBeenCalled();
    });

    it('forces video mute for audio calls', async () => {
        (onSnapshot as Mock).mockImplementation((_docRef, callback) => {
            callback({
                data: () => ({
                    type: 'audio',
                }),
            });
            return vi.fn();
        });

        const { result } = renderHook(() =>
            useCallStatus('123', cleanupStreams, onEndCall, 'audio')
        );

        expect(result.current.isCallerVideoMuted).toBe(true);
        expect(result.current.isCalleeVideoMuted).toBe(true);
    });

    it('cleans up the Firestore subscription on unmount', async () => {
        const { unmount } = renderHook(() =>
            useCallStatus('123', cleanupStreams, onEndCall, 'video')
        );

        unmount();
        expect(unsubscribeMock).toHaveBeenCalled();
    });
});
