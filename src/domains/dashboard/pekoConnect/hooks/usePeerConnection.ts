import { useRef } from 'react';

export const usePeerConnection = () => {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const createPeerConnection = () => {
        if (peerConnectionRef.current) {
            console.warn(
                'A PeerConnection already exists. Reset the connection before creating a new one.'
            );
            closePeerConnection();
        }

        const config = {
            iceServers: [
                {
                    urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
                },
            ],
        };

        peerConnectionRef.current = new RTCPeerConnection(config);

        // Add event listeners if needed (e.g., for ICE candidate gathering, connection state changes, etc.)
        peerConnectionRef.current.onicecandidate = event => {
            if (event.candidate) {
                console.log('New ICE candidate:', event.candidate);
            }
        };

        peerConnectionRef.current.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnectionRef.current?.connectionState);
        };

        return peerConnectionRef.current;
    };

    // Reconnection logic
    const handleReconnection = async () => {
        if (!peerConnectionRef.current) {
            console.error('No active PeerConnection to reconnect');
            return;
        }

        try {
            peerConnectionRef.current.restartIce();

            // Optionally, you might want to re-negotiate the SDP
            if (peerConnectionRef.current.connectionState === 'failed') {
                const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
                await peerConnectionRef.current.setLocalDescription(offer);

                // Send the offer to the remote peer via signaling
                // signalingChannel.send({ type: 'offer', sdp: offer.sdp });
            }
        } catch (error) {
            console.error('Error during reconnection attempt:', error);

            closePeerConnection();
            createPeerConnection();
        }
    };

    const closePeerConnection = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.onicecandidate = null; // Clean up listeners
            peerConnectionRef.current.onconnectionstatechange = null;
            peerConnectionRef.current.close(); // Close the peer connection
            peerConnectionRef.current = null; // Reset the reference
        } else {
            console.warn('No PeerConnection to close');
        }
    };

    return {
        createPeerConnection,
        getPeerConnection: () => peerConnectionRef.current,
        closePeerConnection,
        handleReconnection,
    };
};
