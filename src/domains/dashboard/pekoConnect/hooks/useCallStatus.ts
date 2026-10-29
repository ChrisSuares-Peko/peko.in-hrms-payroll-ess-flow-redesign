import { useState, useEffect } from 'react';

import { doc, onSnapshot } from 'firebase/firestore';

import { firestore } from '../config/firebaseConfig';

type CallStatus = {
    callerVideoMuted: boolean;
    calleeVideoMuted: boolean;
    callerScreenShareMuted: boolean;
    calleeScreenShareMuted: boolean;
    type: string;
    status: string;
};

const useCallStatus = (
    calleeId: string | number | undefined,
    cleanupStreams: () => void,
    onEndCall: () => void,
    type: string
) => {
    const [isCallerVideoMuted, setIsCallerVideoMuted] = useState<boolean>(type === 'audio');
    const [isCalleeVideoMuted, setIsCalleeVideoMuted] = useState<boolean>(type === 'audio');
    const [isCallerScreenShareMuted, setIsCallerScreenShareMuted] = useState<boolean>(true);
    const [isCalleeScreenShareMuted, setIsCalleeScreenShareMuted] = useState<boolean>(true);

    useEffect(() => {
        const callDocRef = doc(firestore, 'calls', `${calleeId}`);
        const unsubscribe = onSnapshot(callDocRef, snapshot => {
            const data = snapshot.data() as CallStatus;
            if (data?.status === 'ended' || data?.status === 'timed-out') {
                cleanupStreams();
                onEndCall();
            }

            if (data) {
                setIsCalleeScreenShareMuted(data.calleeScreenShareMuted);
                setIsCallerScreenShareMuted(data.callerScreenShareMuted);
                setIsCallerVideoMuted(data.callerVideoMuted || false);
                setIsCalleeVideoMuted(data.calleeVideoMuted || false);
                if (data.type === 'audio') {
                    setIsCallerVideoMuted(data.callerVideoMuted || true); // Force avatar display for caller
                    setIsCalleeVideoMuted(data.calleeVideoMuted || true); // Force avatar display for callee
                }
            }
        });

        return () => unsubscribe();
    }, [calleeId, cleanupStreams, onEndCall, isCalleeVideoMuted, isCallerVideoMuted]);

    return {
        isCallerVideoMuted,
        isCalleeVideoMuted,
        isCallerScreenShareMuted,
        isCalleeScreenShareMuted,
    };
};

export default useCallStatus;
