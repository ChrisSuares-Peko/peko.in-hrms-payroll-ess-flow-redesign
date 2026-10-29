import { addDoc, collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

import { firestore } from '../config/firebaseConfig';

export const initiateCall = async (
    callerId: string,
    calleeId: string,
    callerName: string,
    type: string,
    pc: RTCPeerConnection
) => {
    const callDocRef = doc(firestore, 'calls', calleeId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    // Set a timeout to disconnect if the call is not attended within 20 seconds
    const timeout = setTimeout(() => {
        console.warn('Call not attended within 20 seconds. Disconnecting...');
        pc.close();
        // Update the call document to reflect the timeout state
        updateDoc(callDocRef, { status: 'timed-out', hangup: true }).catch(error =>
            console.error('Error updating call status:', error)
        );
    }, 20000);

    pc.onicecandidate = event => {
        if (event.candidate) {
            addDoc(offerCandidates, event.candidate.toJSON());
            // .then(() => console.log('Initiator: ICE Candidate saved.'))
            // .catch(error => console.error('Error saving ICE Candidate:', error));
        }
    };

    const isAudio = type === 'audio';

    const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true, // Always include audio
        ...(type === 'video' && { video: true }), // Include video only for video calls
    });

    // Disable video if it's an audio-only call
    if (isAudio) {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = false;
        });
    }
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(callDocRef, {
        callerName,
        callerId,
        calleeId,
        type,
        rejected: false,
        hangup: false,
        status: 'initiated',
        callerVideoMuted: false,
        calleeVideoMuted: false,
        signaling: {
            offer: { type: offer.type, sdp: offer.sdp },
        },
    });

    onSnapshot(callDocRef, snapshot => {
        const data = snapshot.data();
        if (data?.signaling?.answer) {
            clearTimeout(timeout); // Clear the timeout if the call is attended
            const answer = new RTCSessionDescription(data.signaling.answer);
            pc.setRemoteDescription(answer);
            // .then(() => console.log('Initiator: Remote SDP answer set.'))
            // .catch(error => console.error('Error setting remote SDP answer:', error));
        }
    });

    onSnapshot(answerCandidates, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
                // .then(() => console.log('Initiator: Answer ICE candidate added.'))
                // .catch(error => console.error('Error adding answer ICE candidate:', error));
            }
        });
    });
    return localStream;
};

export const acceptCall = async (callId: string, pc: RTCPeerConnection) => {
    const callDocRef = doc(firestore, 'calls', callId);
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');

    pc.onicecandidate = event => {
        if (event.candidate) {
            addDoc(answerCandidates, event.candidate.toJSON());
            // .then(() => console.log('Receiver: ICE Candidate saved.'))
            // .catch(error => console.error('Error saving ICE Candidate:', error));
        }
    };

    const callDocSnapshot = await getDoc(callDocRef);
    const callData = callDocSnapshot.data();
    if (!callData || !callData.signaling.offer) {
        console.error('Receiver: No valid offer found.');
        return;
    }

    await pc.setRemoteDescription(new RTCSessionDescription(callData.signaling.offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(callDocRef, {
        signaling: {
            ...callData.signaling,
            answer: { type: answer.type, sdp: answer.sdp },
        },
        status: 'accepted',
        calleeScreenShareMuted: true,
        callerScreenShareMuted: true,
    });

    onSnapshot(offerCandidates, snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
                // .then(() => console.log('Receiver: Offer ICE candidate added.'))
                // .catch(error => console.error('Error adding offer ICE candidate:', error));
            }
        });
    });
};

export const rejectCall = async (callId: string) => {
    const callDocRef = doc(firestore, 'calls', callId);
    await updateDoc(callDocRef, { status: 'rejected' });
};
