import React, { useCallback } from 'react';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Typography } from 'antd';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import meeting from '@domains/dashboard/pekoConnect/assets/meeting.png';
// import vectors from '@domains/dashboard/pekoConnect/assets/Vectors.svg';
import { useAppSelector } from '@src/hooks/store';

import CustomAvatar from './CustomAvatar';
import { db } from '../config/firebaseConfig';
import usePutRequest from '../hooks/usePutRequest';

type ConnectionRequestProps = {
    request: any;
    setChatId: (chatId: string) => void;
    setRequest: (request: any) => void;
    refresh: () => void;
    onClose: () => void;
};

const { Text } = Typography;

const ConnectionRequest = ({
    request,
    setChatId,
    setRequest,
    refresh,
    onClose,
}: ConnectionRequestProps) => {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const name = request.senderId === corporateId ? request.receiverName : request.senderName;
    const username =
        request.senderId === corporateId ? request.receiverUsername : request.senderUsername;
    const image = request.senderId === corporateId ? request?.receiverLogo : request?.senderLogo;

    const { handlePutRequest, isLoading: isLoadingPutRequest } = usePutRequest();

    const createRoom = useCallback(async (requests: any) => {
        try {
            const roomsRef = collection(db, 'rooms');

            // Check participants
            const participants = [requests.senderId, requests.receiverId];

            // Create a room document in Firestore
            const roomDoc = await addDoc(roomsRef, {
                participants,
                createdAt: serverTimestamp(),
                senderName: requests.senderName,
                receiverName: requests.receiverName,
                RecieverUsername: requests?.receiverUsername,
                senderUserName: requests?.senderUsername,
            });
            return roomDoc.id; // Return the created room's ID
        } catch (error) {
            console.error('Error creating room:', error);
            return null;
        }
    }, []);

    const handleAccept = useCallback(async () => {
        await handlePutRequest({ requestId: request.id, status: 'ACCEPTED' });

        // Create a chat room
        const roomId = await createRoom(request);

        if (roomId) {
            setRequest(''); // Clear the request
            setChatId(roomId); // Pass the room ID to the chat
            refresh(); // Refresh any related data
        } else {
            console.error('Failed to create room.');
        }
    }, [createRoom, handlePutRequest, request, setChatId, setRequest, refresh]);

    const handleReject = useCallback(() => {
        handlePutRequest({ requestId: request.id, status: 'REJECTED' }).then(() => {
            refresh();
        });
        setRequest('');
    }, [handlePutRequest, request.id, refresh, setRequest]);

    return (
        <Flex data-testid="connection-request" vertical className="flex-grow h-full rounded-xl">
            <Flex align="center" gap={8} className="px-4 py-3">
                <Button
                    type="text"
                    onClick={onClose}
                    shape="circle"
                    size="large"
                    className="md:hidden"
                    icon={<ArrowLeftOutlined />}
                />
                <Flex gap={16} align="center">
                    <CustomAvatar logo={image} name={name} />
                    <Flex vertical gap={1}>
                        <Text>{name ?? 'Unknown Business'}</Text>
                        <Text className="">
                            <span>Peko ID:{username}</span>
                        </Text>
                    </Flex>
                </Flex>
            </Flex>

            <Flex vertical justify="center" align="center" className="h-full bg-gray-100">
                <Image src={meeting} preview={false} style={{ height: 150, width: 'auto' }} />
                {request.senderId !== corporateId ? (
                    <>
                        <Text className="px-6 font-light text-center md:px-0 md:text-3xl">
                            {name} wants to connect
                        </Text>
                        <Text className="px-32 mt-4">
                            {name}: {request.message}
                        </Text>
                        <Flex className="mt-5" gap={10}>
                            <Button
                                loading={isLoadingPutRequest}
                                danger
                                type="primary"
                                className="w-48 font-medium"
                                onClick={handleAccept}
                            >
                                Start conversation
                            </Button>
                            <Button type="default" danger onClick={handleReject}>
                                Reject
                            </Button>
                        </Flex>
                    </>
                ) : (
                    <Text className="px-6 font-light text-center md:px-0 md:text-3xl">
                        {request?.receiverName || 'Unknown name'} is yet to reply to your request
                    </Text>
                )}
            </Flex>
        </Flex>
    );
};

export default ConnectionRequest;
