import { useCallback } from 'react';

const useCleanupStreams = (
    pc: RTCPeerConnection,
    localVideoRef: React.RefObject<HTMLVideoElement>,
    remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
    const cleanupStreams = useCallback(() => {
        // Stop local and remote video streams
        [localVideoRef.current, remoteVideoRef.current].forEach((vid, index) => {
            if (vid && vid.srcObject) {
                const stream = vid.srcObject as MediaStream;

                // Stop all tracks in the stream
                stream.getTracks().forEach(track => {
                    track.stop(); // Stops the track
                });
                // Clear video element
                vid.pause();
                vid.srcObject = null; // Disconnect the video from the stream
            }
        });

        // Close the PeerConnection
        if (pc) {
            pc.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            pc.close();
        }

        // Explicitly release media devices
        navigator.mediaDevices
            .getUserMedia({ audio: true, video: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => console.error('Error releasing media devices:', err));
    }, [pc, localVideoRef, remoteVideoRef]);

    return cleanupStreams;
};

export default useCleanupStreams;
