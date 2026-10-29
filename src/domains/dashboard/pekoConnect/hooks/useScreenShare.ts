import { doc, updateDoc } from 'firebase/firestore';

import { firestore } from '../config/firebaseConfig';

const useScreenShare = (
    pc: RTCPeerConnection,
    role: 'caller' | 'callee',
    localStreamRef: React.RefObject<MediaStream | null>,
    localVideoRef: React.RefObject<HTMLVideoElement | null>,
    screenStreamRef: React.MutableRefObject<MediaStream | null>,
    setVideoMuted: React.Dispatch<React.SetStateAction<boolean>>,
    setScreenSharing: React.Dispatch<React.SetStateAction<boolean>>,
    videoMuted: boolean,
    calleeId?: string | number
) => {
    const startScreenShare = async () => {
        try {
            setVideoMuted(false);
            const callDocRef = doc(firestore, 'calls', `${calleeId}`);
            const randomValues = Math.random().toString(36).substring(7);

            // Start screen sharing
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
            });

            screenStreamRef.current = screenStream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = screenStream;
            }

            const screenTrack = screenStream.getVideoTracks()[0];
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                sender.replaceTrack(screenTrack);
            }

            const updates =
                role === 'caller'
                    ? {
                          callerScreenShareMuted: false,
                          calleeScreenShareMuted: true,
                          random: randomValues,
                      }
                    : {
                          calleeScreenShareMuted: false,
                          callerScreenShareMuted: true,
                          random: randomValues,
                      };
            await updateDoc(callDocRef, updates);

            screenTrack.onended = () => {
                stopScreenShare();
            };

            setScreenSharing(true);
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    };

    const stopScreenShare = async () => {
        const callDocRef = doc(firestore, 'calls', `${calleeId}`);
        const randomValues = Math.random().toString(36).substring(7);
        if (videoMuted) {
            setVideoMuted(true);
        }
        const updates =
            role === 'caller'
                ? { callerScreenShareMuted: true, random: randomValues }
                : { calleeScreenShareMuted: true, random: randomValues };

        await updateDoc(callDocRef, updates);

        // Stop screen sharing
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // After stopping the screen share, switch back to local camera
        if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender && cameraTrack) {
                sender.replaceTrack(cameraTrack); // Replacing track back to camera
            }

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
        }

        setScreenSharing(false);
    };

    const handleScreenShareToggle = () => {
        if (screenStreamRef.current) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    };

    return {
        handleScreenShareToggle,
        startScreenShare,
        stopScreenShare,
    };
};

export default useScreenShare;
