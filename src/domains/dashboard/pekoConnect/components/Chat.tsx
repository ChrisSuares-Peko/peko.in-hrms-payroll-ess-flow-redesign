import React, { useState, useEffect, useCallback } from 'react';

import { Button, Flex, Input } from 'antd';
import {
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
} from 'firebase/firestore';
import { ReactSVG } from 'react-svg';

import FileAttach from '@domains/dashboard/pekoConnect/assets/fileAttach.svg';
import sendIcon from '@domains/dashboard/pekoConnect/assets/sendIcon.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import ChatBody from './ChatBody';
import ChatHeader from './ChatHeader';
import EmojiPanel from './EmojiPanel';
import FilePreviewModal from './FilePreviewModal';
import { db, firestore } from '../config/firebaseConfig';
import { useChatMessages } from '../hooks/useChatMessages';
import { useFileHandling } from '../hooks/useFileHandling';
import { usePeerConnection } from '../hooks/usePeerConnection';
import usePostChatFile from '../hooks/usePostChatFile';
import Calling from '../pages/Calling';
import VideoCall from '../pages/videoCall';
import { initiateCall } from '../utils/setupWebrtc';

const Chat = ({ currentUser, roomId, rName, recieverId, sendId }: any) => {
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [streams, setStream] = useState<MediaStream | null>(null); // Remote stream
    const { user } = useAppSelector(state => state.reducer.user);
    const { createPeerConnection, closePeerConnection } = usePeerConnection();
    const [calleeName, setCalleeName] = useState<string | null>(null);
    const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false); // New state for waiting screen
    const [newMessage, setNewMessage] = useState('');
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [type, setType] = useState<string>('');
    const { handlePostChatFile, isLoading: isLoadingPostChatFile } = usePostChatFile();
    const dispatch = useAppDispatch();
    const {
        file,
        previewImage,
        previewVisible,
        handleInputChange,
        handleProceedFileSend,
        resetState,
    } = useFileHandling(dispatch, handlePostChatFile, currentUser);

    const messages = useChatMessages(roomId, currentUser.email);
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const resolvedSenderId = user?.username === recieverId ? user?.username : sendId; // Ensure the sender is correct

    const handleSubmit = useCallback(
        async (e?: React.FormEvent, typ?: string, message?: string) => {
            e?.preventDefault();
            const msg = message || newMessage;
            if ((!msg.trim() && !file) || !roomId) return;

            const messagesRef = collection(db, 'rooms', roomId, 'messages');

            if (msg.trim()) {
                await addDoc(messagesRef, {
                    type: typ || 'text',
                    text: msg,
                    sender: currentUser.email,
                    createdAt: serverTimestamp(),
                    seenBy: [],
                });
                setNewMessage('');
            }

            if (file) {
                await handleProceedFileSend(messagesRef);
            }
        },
        [newMessage, file, roomId, currentUser.email, handleProceedFileSend]
    );

    const handleImageClick = () => {
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
            imageInputRef.current.click();
        }
    };

    const handleCancel = () => {
        resetState();
    };

    const handleEmojiClick = (emoji: any) => {
        setNewMessage(prev => prev + emoji.emoji);
    };

    const handleCall = async (callType: string) => {
        setNewMessage('Call started');
        setType(callType);
        const callerName = user?.companyName ?? '';

        const pc = createPeerConnection();
        try {
            // Create a new PeerConnection instance for the call
            setPeerConnection(pc); // Save the reference in the state
            const stream = await initiateCall(
                resolvedSenderId,
                resolvedSenderId === sendId ? recieverId : sendId,
                callerName,
                callType,
                pc
            );
            setLocalStream(stream); // Save the local stream for cleanup

            pc.ontrack = event => {
                const [remoteStream] = event.streams;
                setStream(remoteStream);
            };
            handleSubmit(undefined, 'Call', 'Call started');
        } catch (error) {
            console.error('Error initiating call:', error);
        }
    };

    const handleEndCall = useCallback(async () => {
        const userDocRef = doc(
            firestore,
            'calls',
            `${resolvedSenderId === sendId ? recieverId : sendId}`
        );
        await updateDoc(userDocRef, { hangup: true, status: 'ended' });
        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            setLocalStream(null);
        }

        // Stop remote stream tracks
        if (streams) {
            streams.getTracks().forEach(track => {
                track.stop();
            });
            setStream(null);
        }

        // Close PeerConnection
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }

        // Close and reset the PeerConnection
        closePeerConnection();
        setPeerConnection(null);
        setIsVideoCallActive(false);
    }, [
        resolvedSenderId,
        sendId,
        recieverId,
        localStream,
        streams,
        peerConnection,
        closePeerConnection,
    ]);

    useEffect(() => {
        const userDocRef = doc(
            firestore,
            'calls',
            `${resolvedSenderId === sendId ? recieverId : sendId}`
        );

        const unsubscribe = onSnapshot(userDocRef, snapshot => {
            const data = snapshot.data();
            const { status, rejected, hangup } = data || {};

            if (status === 'accepted' && !hangup) {
                setIsVideoCallActive(true); // The video call is now active
                setIsWaitingForAcceptance(false); // Hide waiting component
            } else if (rejected || hangup) {
                setIsWaitingForAcceptance(false); // Hide waiting component
            } else if (status === 'initiated') {
                setIsWaitingForAcceptance(true); // Show the waiting component
            }

            if (status === 'timed-out') {
                console.warn('Call timed out. Initiating cleanup.');
                handleEndCall();
            }
            setCalleeName(data?.calleeName);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, [recieverId, resolvedSenderId, sendId, handleEndCall]);

    if (isWaitingForAcceptance) {
        return <Calling mode="create" hangUp={handleEndCall} />;
    }
    if (isVideoCallActive && streams) {
        return (
            <VideoCall
                pc={peerConnection!}
                onEndCall={handleEndCall}
                callRole="caller"
                remoteStreams={streams}
                callerName={calleeName!}
                calleeId={resolvedSenderId === sendId ? recieverId : sendId}
                type={type}
            />
        );
    }

    return (
        <Flex vertical className="flex-grow h-full bg-white rounded-xl">
            {/* Header */}
            <ChatHeader
                rName={rName}
                handleCall={handleCall}
                recieverId={recieverId}
                sendId={sendId}
            />
            {/* Chat Body */}
            <div className="flex flex-col-reverse flex-grow overflow-auto bg-gray-100">
                <ChatBody messages={messages} />
            </div>
            <Flex align="center" gap={16} className="p-4 bg-white rounded">
                <ReactSVG
                    src={FileAttach}
                    onClick={handleImageClick}
                    className="text-lg cursor-pointer"
                />
                <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ref={imageInputRef}
                    onChange={handleInputChange}
                />
                <Flex className="flex-grow gap-2 px-4 py-1 bg-[#FAFAFA] rounded-xl items-center">
                    <EmojiPanel data-testid="emoji-button" onEmojiClick={handleEmojiClick} />
                    <Input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your message here"
                        className="bg-[#FAFAFA] border-none rounded-lg focus:ring-0 focus:bg-transparent focus:outline-none"
                        onKeyUp={e => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                        autoFocus
                    />
                </Flex>
                <Button
                    type="text"
                    onClick={handleSubmit}
                    data-testid="send-button"
                    icon={<ReactSVG src={sendIcon} />}
                />
            </Flex>
            <FilePreviewModal
                previewVisible={previewVisible}
                previewImage={previewImage || null}
                file={file}
                isLoadingPostChatFile={isLoadingPostChatFile}
                handleCancel={handleCancel}
                handleSubmit={handleSubmit}
            />
        </Flex>
    );
};

export default Chat;
