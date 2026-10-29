import { useEffect, useRef } from 'react';

const useMediaStreams = (pc: RTCPeerConnection, type: string) => {
    const localStreamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const setupStreams = async () => {
            try {
                // Get the user's local media stream
                const localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true, // Always include audio
                    ...(type === 'video' && { video: true }), // Include video only for video calls
                });
                localStreamRef.current = localStream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStream;
                }
            } catch (error) {
                console.error('Error setting up streams:', error);
            }
        };

        setupStreams();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
        };
    }, [pc, type]);

    return { localStreamRef, localVideoRef };
};

export default useMediaStreams;
