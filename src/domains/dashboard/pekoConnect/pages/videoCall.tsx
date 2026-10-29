/* eslint-disable jsx-a11y/media-has-caption */
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

import { Avatar, Button, Typography } from 'antd';
import { doc, updateDoc } from 'firebase/firestore';
import { CiVideoOn } from 'react-icons/ci';

import CallControls from '../components/CallControls';
import LocalAvatarRenderer from '../components/LocalAvatarRenderer';
import { firestore } from '../config/firebaseConfig';
import useCallStatus from '../hooks/useCallStatus';
import useCleanupStreams from '../hooks/useCleanupStreams';
import useMediaStreams from '../hooks/useMediaStreams';
import { usePeerConnection } from '../hooks/usePeerConnection';
import useScreenShare from '../hooks/useScreenShare';
import { toggleAudioMute, toggleVideoMute } from '../utils/videocallService';

type VideoCallProps = {
    onEndCall: () => void;
    pc: RTCPeerConnection;
    callRole: 'caller' | 'callee';
    remoteStream?: MediaStream; // Optional prop for callee
    remoteStreams?: MediaStream; // Optional prop for callee
    callerName?: string;
    calleeName?: string;
    calleeId?: string | number;
    type: string;
};

const { Text } = Typography;

const VideoCall: React.FC<VideoCallProps> = ({
    onEndCall,
    pc,
    callRole: role,
    remoteStream,
    remoteStreams,
    callerName,
    calleeName,
    calleeId,
    type,
}) => {
    const [audioMuted, setAudioMuted] = useState<boolean>(true);
    const [videoMuted, setVideoMuted] = useState<boolean>(type === 'video');
    const [screenSharing, setScreenSharing] = useState<boolean>(false);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const { handleReconnection } = usePeerConnection();
    const { localStreamRef, localVideoRef } = useMediaStreams(pc, type);
    const { handleScreenShareToggle, stopScreenShare } = useScreenShare(
        pc,
        role,
        localStreamRef,
        localVideoRef,
        screenStreamRef,
        setVideoMuted,
        setScreenSharing,
        videoMuted,
        calleeId
    );
    const cleanupStreams = useCleanupStreams(pc, localVideoRef, remoteVideoRef);
    const {
        isCallerVideoMuted,
        isCalleeVideoMuted,
        isCallerScreenShareMuted,
        isCalleeScreenShareMuted,
    } = useCallStatus(calleeId, cleanupStreams, onEndCall, type);

    useEffect(() => {
        // Handle remote stream
        const handleRemoteStream = () => {
            if (remoteStream && remoteVideoRef.current) {
                remoteStreamRef.current = remoteStream; // Store in ref for cleanup
                remoteVideoRef.current.srcObject = remoteStream;
            } else if (role === 'caller') {
                if (remoteStreams && remoteVideoRef.current) {
                    remoteStreamRef.current = remoteStreams; // Store in ref for cleanup
                    remoteVideoRef.current.srcObject = remoteStreams;
                } else {
                    pc.ontrack = event => {
                        const [stream] = event.streams;
                        if (stream && remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = stream;
                        }
                    };
                }
            }
        };

        handleRemoteStream();

        return () => {
            pc.ontrack = null; // Cleanup listener
        };
    }, [pc, remoteStream, role, remoteStreams]);

    pc.onconnectionstatechange = async () => {
        if (pc?.connectionState === 'disconnected') {
            console.warn('PeerConnection disconnected. Attempting to reconnect...');

            await handleReconnection();
        } else if (pc?.connectionState === 'failed') {
            cleanupStreams();
            onEndCall();
        }
    };

    const handleAudioToggle = useCallback(() => {
        toggleAudioMute(pc, localStreamRef, audioMuted, setAudioMuted);
    }, [audioMuted, localStreamRef, pc]);

    const handleVideoToggle = useCallback(async () => {
        try {
            if (!videoMuted && screenSharing) {
                stopScreenShare();
            }
            const newVideoMutedState = !videoMuted;
            const callDocRef = doc(firestore, 'calls', `${calleeId}`);
            const fieldToUpdate = role === 'caller' ? 'callerVideoMuted' : 'calleeVideoMuted';
            const randomValues = Math.random().toString(36).substring(7);
            // Update Firestore with the new state
            await updateDoc(callDocRef, {
                [fieldToUpdate]: !newVideoMutedState,
                randomValue: randomValues,
            });

            // Toggle the local video mute
            toggleVideoMute(pc, localStreamRef, videoMuted, setVideoMuted, localVideoRef);
        } catch (error) {
            console.error('Failed to update video mute state:', error);
        }
    }, [
        videoMuted,
        screenSharing,
        calleeId,
        role,
        pc,
        localStreamRef,
        localVideoRef,
        stopScreenShare,
    ]);

    const isAudioOnly = type === 'audio';
    const isMutedVideoCondition =
        ((role === 'caller' && isCalleeVideoMuted && isCalleeScreenShareMuted) ||
            (role === 'callee' && isCallerVideoMuted && isCallerScreenShareMuted)) ??
        true;

    return (
        <div className="fixed inset-0 bg-black">
            <div className="flex flex-col w-full h-full">
                <div className="flex items-center justify-start h-16">
                    <Button
                        type="text"
                        icon={<CiVideoOn />}
                        className="flex items-center justify-center p-4 text-xl font-bold bg-transparent border-none text-brandColor"
                    >
                        {role === 'callee' ? calleeName : callerName}
                    </Button>
                </div>
                <div className="relative flex-grow">
                    <LocalAvatarRenderer localVideoRef={localVideoRef} videoMuted={videoMuted} />
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute z-40 w-32 h-40 rounded-lg -10 bottom-6 right-6 md:bottom-8 md:right-4 md:w-72 md:h-52"
                    />
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="relative object-fill w-full p-4 overflow-hidden rounded-lg max-h-svh"
                    />
                    {(isAudioOnly || isMutedVideoCondition) && (
                        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center z-50 bg-opacity-50 bg-black">
                            <Avatar
                                size="large"
                                draggable={false}
                                shape="circle"
                                className="bg-[#ffeeee] w-32 h-32 md:w-64 md:h-64"
                            >
                                <Text className="text-5xl font-bold md:text-9xl text-brandColor">
                                    {role === 'callee'
                                        ? calleeName?.slice(0, 1)
                                        : callerName?.slice(0, 1)}
                                </Text>
                            </Avatar>
                        </div>
                    )}
                    <CallControls
                        audioMuted={audioMuted}
                        videoMuted={videoMuted}
                        screenSharing={screenSharing}
                        type={type}
                        handleAudioToggle={handleAudioToggle}
                        handleVideoToggle={handleVideoToggle}
                        handleScreenShareToggle={handleScreenShareToggle}
                        onEndCall={onEndCall}
                        cleanupStreams={cleanupStreams}
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(VideoCall);
