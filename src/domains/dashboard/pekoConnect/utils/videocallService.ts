import { addDoc, collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

import { firestore } from '../config/firebaseConfig';

export const handleAnswerCall = async (
    pc: RTCPeerConnection,
    recipientId: string,
    callerId: string
) => {
    const callDocRef = doc(firestore, 'calls', recipientId);
    // const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');

    const callDoc = await getDoc(callDocRef);
    const callData = callDoc.data();
    const offerDescription = callData?.signaling?.offer;
    if (!offerDescription) {
        console.error('No offer description found');
        return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();

    if (!answerDescription) {
        console.error('Failed to create answer description');
        return;
    }

    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };

    await setDoc(callDocRef, { answer }, { merge: true });

    onSnapshot(offerCandidates, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const data = change.doc.data();
                try {
                    pc.addIceCandidate(new RTCIceCandidate(data));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        });
    });
};

export const handleCreateCall = async (
    pc: RTCPeerConnection,
    recipientId: string,
    callerId: string
) => {
    if (!recipientId) {
        alert('Please enter a Recipient ID.');
        return;
    }

    const callDoc = doc(firestore, 'calls', recipientId);
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    pc.onicecandidate = event => {
        if (event.candidate) {
            addDoc(offerCandidates, event.candidate.toJSON());
        }
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
        callerId,
    };

    await setDoc(callDoc, { offer });

    onSnapshot(callDoc, snapshot => {
        const data = snapshot.data();
        if (data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });

    onSnapshot(answerCandidates, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });
};

export const listenForIncomingCalls = (
    userId: string,
    onCallReceived: (offer: any, callerId: string) => void
) => {
    const callDocRef = doc(firestore, 'calls', userId);

    // Return the unsubscribe function from onSnapshot
    return onSnapshot(callDocRef, snapshot => {
        const data = snapshot.data();
        if (data && data.offer) {
            onCallReceived(data.offer, data.callerId); // Call the callback with offer and callerId
        }
    });
};

export const handleHangUp = async (
    recipientId: string,
    pc: RTCPeerConnection,
    localStreamRef: React.RefObject<MediaStream | null>,
    remoteStreamRef: React.RefObject<MediaStream | null>,
    cleanupLocalStreams: { (): void; (): void }
) => {
    const callDocRef = doc(firestore, 'calls', recipientId);
    await setDoc(callDocRef, { hangup: true }, { merge: true });

    // Cleanup local streams
    pc.close();
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
    }
    cleanupLocalStreams();
};

// export const toggleVideoMute = (
//     localStreamRef: React.RefObject<MediaStream | null>,
//     videoMuted: boolean,
//     setVideoMuted: (value: boolean) => void
// ) => {
//     if (localStreamRef.current) {
//         const videoTrack = localStreamRef.current.getVideoTracks()[0];
//         if (videoTrack) {
//             videoTrack.enabled = !videoMuted;
//             setVideoMuted(!videoMuted);
//         }
//     }
// };

// export const toggleAudioMute = (
//     localStreamRef: React.RefObject<MediaStream | null>,
//     audioMuted: boolean,
//     setAudioMuted: (value: boolean) => void
// ) => {
//     if (localStreamRef.current) {
//         const audioTrack = localStreamRef.current.getAudioTracks()[0];
//         if (audioTrack) {
//             audioTrack.enabled = !audioMuted;
//             setAudioMuted(!audioMuted);
//         }
//     }
// };

export const toggleAudioMute = (
    pc: RTCPeerConnection,
    localStreamRef: React.RefObject<MediaStream | null>,
    audioMuted: boolean,
    setAudioMuted: React.Dispatch<React.SetStateAction<boolean>>
) => {
    if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !audioMuted;
        });

        // Stop sending audio track if muted
        pc.getSenders().forEach(sender => {
            if (sender.track?.kind === 'audio') {
                sender.track.enabled = !audioMuted;
            }
        });

        setAudioMuted(!audioMuted);
    } else {
        console.warn('No local audio track available to mute/unmute.');
    }
};

export const toggleVideoMute = (
    pc: RTCPeerConnection,
    localStreamRef: React.RefObject<MediaStream | null>,
    videoMuted: boolean,
    setVideoMuted: React.Dispatch<React.SetStateAction<boolean>>,
    localVideoRef: React.RefObject<HTMLVideoElement>
) => {
    if (localStreamRef.current) {
        const videoTracks = localStreamRef.current.getVideoTracks();

        // Toggle video tracks
        videoTracks.forEach(track => {
            track.enabled = !videoMuted;
        });

        // Ensure the sender track is updated
        const videoSender = pc.getSenders().find(sender => sender.track?.kind === 'video');
        if (videoSender) {
            if (videoSender.track) {
                videoSender.track.enabled = !videoMuted;
            }
        }

        // Update the local video element
        if (localVideoRef.current) {
            if (!videoMuted) {
                // Re-attach the local stream to the video element
                localVideoRef.current.srcObject = localStreamRef.current;
            } else {
                // Optionally set the video element source to null
                localVideoRef.current.srcObject = null;
            }
        }

        // Update the video muted state
        setVideoMuted(!videoMuted);
    } else {
        console.warn('No local video track available to mute/unmute.');
    }
};

export default {
    handleAnswerCall,
    handleCreateCall,
    handleHangUp,
    toggleVideoMute,
    toggleAudioMute,
    listenForIncomingCalls,
};
