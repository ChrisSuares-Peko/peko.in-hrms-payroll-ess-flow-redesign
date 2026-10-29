/* eslint-disable no-nested-ternary */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState, useEffect } from 'react';

import { Avatar, Badge, Divider, Empty, Flex, Typography } from 'antd';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ReactSVG } from 'react-svg';
import { twMerge } from 'tailwind-merge';

import FilePreview from '@domains/dashboard/pekoConnect/assets/file-preview.svg';
import { useAppSelector } from '@src/hooks/store';

import { db } from '../config/firebaseConfig';
import { formatDateOrTime } from '../utils';

type ChatListProps = {
    requests: any[];
    setRequest: any;
    chatId: string | null;
    setChatId: (chatId: string | null) => void;
    setRname: any;
    queryString: string; // Add the query prop
    setRecieverId: any;
    setSendId: any;
};

const { Text } = Typography;

const ChatList = ({
    requests,
    setRequest,
    chatId,
    setChatId,
    setRname,
    queryString,
    setRecieverId,
    setSendId,
}: ChatListProps) => {
    const [connections, setConnections] = useState<any>([]); // State for connections
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const currentUserEmail = user?.email;

    const fetchConnections = (Cid: string) => {
        const roomsRef = collection(db, 'rooms');

        const q = query(roomsRef, where('participants', 'array-contains', Cid));

        const unsubscribe = onSnapshot(q, async snapshot => {
            const roomData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Listen for real-time updates to each room's messages
            const connectionsWithMessages = await Promise.all(
                roomData.map(async room => {
                    const messagesRef = collection(db, 'rooms', room.id, 'messages');
                    const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'));

                    // Subscribe to messages for real-time updates
                    let messages: any[] = [];
                    const unsubscribeMessages = onSnapshot(messagesQuery, snapshots => {
                        messages = snapshots.docs.map(messageDoc => ({
                            id: messageDoc.id,
                            ...messageDoc.data(),
                        }));

                        // Update last message and real-time state
                        setConnections((prevConnections: any) =>
                            prevConnections
                                .map((conn: any) =>
                                    conn.id === room.id
                                        ? {
                                              ...conn,
                                              messages,
                                              lastMessage:
                                                  messages[0]?.type === 'image' ? (
                                                      '📷 image'
                                                  ) : messages[0]?.type === 'file' ? (
                                                      <Flex gap={5} align="center">
                                                          <ReactSVG src={FilePreview} />
                                                          <Text className="text-xs truncate">
                                                              document
                                                          </Text>
                                                      </Flex>
                                                  ) : (
                                                      messages[0]?.text || 'No messages yet'
                                                  ),
                                              lastMessageTime: messages[0]?.createdAt || null,
                                          }
                                        : conn
                                )
                                .sort((a: any, b: any) => {
                                    const timeA = a.lastMessageTime ? a.lastMessageTime.seconds : 0;
                                    const timeB = b.lastMessageTime ? b.lastMessageTime.seconds : 0;
                                    return timeB - timeA; // Sort in descending order
                                })
                        );
                    });

                    return {
                        ...room,
                        messages,
                        unsubscribeMessages,
                    };
                })
            );

            setConnections(connectionsWithMessages);
        });

        return unsubscribe;
    };

    useEffect(() => {
        if (corporateId) {
            const unsubscribe = fetchConnections(corporateId);
            return () => unsubscribe();
        }
        return undefined;
    }, [corporateId]);

    // Filter requests and connections based on the query
    const filteredRequests = requests?.filter(req =>
        req.senderName?.toLowerCase().includes(queryString.toLowerCase())
    );

    const filteredConnections = connections.filter((connection: any) =>
        connection.receiverName?.toLowerCase().includes(queryString.toLowerCase())
    );

    const renderConnection = (connection: any, roomId: any) => {
        const name =
            connection?.participants[0] === corporateId
                ? connection.receiverName
                : connection.senderName;
        const lastMessage = connection.lastMessage || 'No messages yet';
        const time = connection.lastMessageTime
            ? new Date(connection.lastMessageTime.toDate()).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : '';

        const unseenCount = connection.messages?.filter(
            (msg: any) =>
                !msg.seenBy?.includes(currentUserEmail) && // Message is not seen by the current user's email
                msg.sender !== currentUserEmail // Message is not sent by the current user
        ).length;

        return (
            <Flex
                data-testid="chat-list"
                key={connection.id}
                className={twMerge('m-1 px-2 py-4 rounded-xl hover:bg-gray-50')}
            >
                <Flex className="flex items-center justify-start w-full gap-4 px-2">
                    <Flex>
                        <Avatar
                            style={{
                                backgroundColor: '#FFE6E6',
                                color: '#FF4F4F',
                                fontWeight: 'bolder',
                            }}
                        >
                            {name[0]?.toUpperCase()}
                        </Avatar>
                    </Flex>
                    <Flex vertical justify="center" gap={1} className="w-full border-gray-100">
                        <Flex justify="space-between" align="center" gap={4} className="w-full">
                            <Flex vertical className="w-4/5">
                                <p className="text-darkBlue font-medium text-[13px] line-clamp-1">
                                    {name}
                                </p>
                                <Text
                                    ellipsis
                                    className="w-48 mt-1 text-xs font-normal text-secondary line-clamp-1 md:w-32 lg:w-28 xl:w-44"
                                >
                                    {lastMessage}
                                </Text>
                            </Flex>
                            <Flex vertical className="items-end justify-start w-1/5 gap-1">
                                <p className="text-[11px] text-textDisabledGray">{time}</p>
                                <div className="h-4">
                                    {unseenCount > 0 && (
                                        <Badge
                                            color={unseenCount <= 5 ? 'green' : 'red'}
                                            count={unseenCount}
                                            overflowCount={9}
                                            size="small"
                                        />
                                    )}
                                </div>
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const renderRequest = (req: any) => {
        const name =
            user?.username === req.senderUsername
                ? req.receiverName
                : req.senderName || 'Unknown Business';
        const message = req.message || 'Pending request message';
        const time = formatDateOrTime(req.createdAt) || '12:45 PM';

        return (
            <div
                key={req.id}
                className={twMerge('m-1 px-2 py-4 rounded-xl hover:bg-gray-50')}
                onClick={() => {
                    setChatId(null);
                    setRequest(req);
                }}
            >
                <div className="flex items-center justify-start gap-4 px-2">
                    <div className="min-w-6">
                        <Avatar
                            style={{
                                backgroundColor: '#FFE6E6',
                                color: '#FF4F4F',
                                fontWeight: 'bolder',
                            }}
                        >
                            {name[0]?.toUpperCase()}
                        </Avatar>
                    </div>
                    <Flex vertical justify="center" gap={1} className="w-full border-gray-100">
                        <Flex justify="space-between" align="center" gap={4} className="w-full">
                            <div>
                                <p className="text-darkBlue font-medium text-[13px] line-clamp-1">
                                    {name}
                                </p>
                                <p className="text-xs font-normal text-secondary line-clamp-1">
                                    {message}
                                </p>
                            </div>
                            <p className="text-xs text-textDisabledGray">{time}</p>
                        </Flex>
                    </Flex>
                </div>
            </div>
        );
    };

    return (
        <ul className="h-full overflow-y-scroll">
            {/* Pending Connection Requests */}
            <Divider />
            <Text className="px-2 py-4 m-2">
                {filteredRequests?.length > 0
                    ? `${filteredRequests?.length} Pending Connection Request${
                          filteredRequests?.length > 1 ? 's' : ''
                      }`
                    : ''}
            </Text>
            {filteredRequests?.map(req => <li key={req.id}>{renderRequest(req)}</li>)}

            {/* Connections */}
            {filteredRequests?.length > 0 && (
                <>
                    <Divider />
                    <Text className="px-2 py-4 m-2">Connections</Text>
                </>
            )}

            {filteredConnections.length > 0 ? (
                filteredConnections.map((connection: any) => (
                    <li
                        key={connection.id}
                        onClick={() => {
                            const name =
                                connection?.participants[0] === corporateId
                                    ? connection.receiverName
                                    : connection.senderName;
                            const ReId = connection?.RecieverUsername;
                            const sId = connection?.senderUserName;
                            setSendId(sId);
                            setRecieverId(ReId);
                            setRname(name);
                            setChatId(connection.id);
                        }}
                    >
                        {renderConnection(connection, connection.id)}
                    </li>
                ))
            ) : (
                <Flex
                    justify="center"
                    align="center"
                    className={twMerge('flex-grow bg-white h-full p-4')}
                >
                    <Empty description="No Connections Found" />
                </Flex>
            )}
        </ul>
    );
};

export default ChatList;
