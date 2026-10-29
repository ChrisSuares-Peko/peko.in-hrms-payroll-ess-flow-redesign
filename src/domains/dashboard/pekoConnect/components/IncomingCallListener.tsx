/* eslint-disable consistent-return */
import React, { useCallback, useEffect, useState } from 'react';

import { Avatar, Button, Divider, Flex, Typography } from 'antd';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { capitalize } from 'lodash';
import { FiVideo, FiPhoneMissed, FiPhone } from 'react-icons/fi';

import ringtoneFile from '@assets/audio/callRingtone.wav';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import { firestore } from '../config/firebaseConfig';
import { usePeerConnection } from '../hooks/usePeerConnection';
import VideoCall from '../pages/videoCall';
import { acceptCall } from '../utils/setupWebrtc';

const { Text } = Typography;

type IncomingCallListenerProps = {
    userId: string | number;
    children?: React.ReactNode;
};

const IncomingCallListener: React.FC<IncomingCallListenerProps> = ({ userId, children }) => {
    const { md } = useScreenSize();

    const { user } = useAppSelector(state => state.reducer.user);

    const [isCalling, setIsCalling] = useState(false);
    const [callerName, setCallerName] = useState<string | null>(null);
    const [ringtonePlaying, setRingtonePlaying] = React.useState(false);
    const [isInCall, setIsInCall] = useState(false); // Track if the user is in a call
    const [stream, setStream] = useState<MediaStream | null>(null); // Remote stream
    const [callType, setCallType] = useState<string | null>(null); // Track the type of the incoming call

    const { createPeerConnection, closePeerConnection } = usePeerConnection();
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

    const handleAnswerCall = async (type: string) => {
        try {
            const pc = createPeerConnection(); // Create a new PeerConnection
            setPeerConnection(pc); // Save the PeerConnection instance
            setCallType(type); // Save the call type
            const userDocRef = doc(firestore, 'calls', `${userId}`);
            const snapshot = await getDoc(userDocRef);
            snapshot.data();
            const companyName = user?.companyName; // Assuming `user` is accessible in this scope
            if (companyName) {
                await updateDoc(userDocRef, {
                    calleeName: companyName,
                });
            }
            const isAudio = type === 'audio';
            const localStream = await navigator.mediaDevices.getUserMedia({
                audio: true, // Always include audio
                ...(type === 'video' && { video: true }), // Include video only for video calls
            });
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isAudio;
            }); // Disable video if audio-only
            localStream.getTracks().forEach(track => pc?.addTrack(track, localStream));

            pc.ontrack = event => {
                const [remoteStream] = event.streams;
                setStream(remoteStream); // Set the remote stream
            };

            await acceptCall(userId.toString(), pc);
            setIsCalling(false); // Close modal
            setIsInCall(true); // Show the VideoCall component
        } catch (error) {
            console.error('Error answering call:', error);
        }
    };

    useEffect(() => {
        if (isCalling) {
            // Start playing ringtone when receiving call
            setRingtonePlaying(true);
        } else {
            // Stop playing ringtone when call ends or declined
            setRingtonePlaying(false);
        }
    }, [isCalling]);

    useEffect(() => {
        if (!userId) return;

        const userDocRef = doc(firestore, 'calls', `${userId}`);
        const unsubscribe = onSnapshot(userDocRef, snapshot => {
            const data = snapshot.data();
            if (!data) return;

            const { callerId, rejected, hangup, type, randomValue, random } = data;

            if (hangup || rejected) {
                // End the call if it's been hung up or rejected
                setIsInCall(false);
                setIsCalling(false);
                return;
            }
            if (randomValue || random) {
                // Ignore updates for video mute/unmute states
                return;
            }
            setCallType(type || null);
            // Only show the modal if there's a new call that has not been rejected or ended
            if (callerId && callerId !== userId && !rejected && !hangup) {
                setIsCalling(true);
                setCallerName(data?.callerName);
            } else {
                setIsCalling(false); // Reset modal state if the call is rejected or ended
            }
        });

        return () => unsubscribe(); // Cleanup listener
    }, [userId]);

    const handleRejectCall = useCallback(async () => {
        const userDocRef = doc(firestore, 'calls', `${userId}`);
        await updateDoc(userDocRef, { rejected: true });

        // Cleanup the PeerConnection and reset state
        closePeerConnection();
        setPeerConnection(null);
        setIsCalling(false);
        setStream(null);
    }, [closePeerConnection, userId]);

    const handleEndCall = useCallback(async () => {
        const userDocRef = doc(firestore, 'calls', `${userId}`);
        await updateDoc(userDocRef, { hangup: true, status: 'ended' });

        // Cleanup the PeerConnection and reset state
        closePeerConnection();
        setPeerConnection(null);
        setIsInCall(false);
        setStream(null);
    }, [closePeerConnection, userId]);

    return (
        <>
            {!isInCall && children}
            {isInCall && peerConnection && stream && (
                <VideoCall
                    pc={peerConnection}
                    onEndCall={handleEndCall}
                    callRole="callee"
                    remoteStream={stream}
                    calleeName={callerName!}
                    calleeId={userId}
                    type={callType!}
                />
            )}

            {isCalling && (
                <div className="absolute inset-0 z-50 flex items-start justify-end top-4 right-4">
                    {/* Audio element for ringtone */}
                    {ringtonePlaying && (
                        <audio autoPlay loop>
                            <track kind="captions" srcLang="en" label="English captions" />
                            <source src={ringtoneFile} type="audio/mp3" />
                        </audio>
                    )}
                    <div className="relative w-full max-w-md py-4 bg-white border shadow-2xl rounded-2xl">
                        <Flex justify="space-between" className="px-5 pb-1">
                            <Text className="text-base text-gray-500">Peko Connect</Text>
                            <Text className="text-base text-gray-500">Incoming Call</Text>
                        </Flex>
                        <Divider />
                        <Flex justify="center" className="px-5 pt-2">
                            <Avatar
                                size="large"
                                draggable={false}
                                className="bg-[#ffeeee] w-20 h-20"
                            >
                                <Text
                                    // style={{ color: colorPrimary }}
                                    className="text-4xl font-bold text-brandColor"
                                >
                                    {callerName?.slice(0, 1) || '-'}
                                </Text>
                            </Avatar>
                        </Flex>
                        <Flex vertical className="pt-3" align="center">
                            <Text className="text-xl font-semibold">
                                {capitalize(callerName || '')}
                            </Text>
                            <Text className="text-lg text-gray-500">is calling you</Text>
                        </Flex>
                        <Flex justify="center" gap={10} className="pt-4">
                            {callType === 'video' && (
                                <Button
                                    onClick={() => handleAnswerCall('video')}
                                    type="default"
                                    icon={md && <FiVideo className="mt-[0.26rem]" />}
                                    className="flex px-4 text-white rounded-md bg-vidoCallGreen"
                                >
                                    {md ? 'Video Call' : <FiVideo className="mt-[0.26rem]" />}
                                </Button>
                            )}
                            {callType === 'audio' && (
                                <Button
                                    onClick={() => handleAnswerCall('audio')}
                                    type="default"
                                    icon={md && <FiPhone className="mt-[0.26rem]" />}
                                    className="flex px-4 text-white rounded-md bg-audioCallGreen"
                                >
                                    {md ? 'Voice Call' : <FiPhone className="mt-[0.26rem]" />}
                                </Button>
                            )}
                            <Button
                                onClick={handleRejectCall}
                                type="primary"
                                icon={md && <FiPhoneMissed className="mt-[0.26rem] text-white" />}
                                danger
                                className="flex px-4 rounded-md bg-declineCallRed "
                            >
                                {md ? (
                                    'Decline'
                                ) : (
                                    <FiPhoneMissed className="mt-[0.26rem] text-white" />
                                )}
                            </Button>
                        </Flex>
                    </div>
                </div>
            )}
        </>
    );
};

export default IncomingCallListener;
