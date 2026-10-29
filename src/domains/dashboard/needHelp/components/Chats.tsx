import React, { useCallback, useRef, useState } from 'react';

import { ArrowUpOutlined, CaretRightOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Flex, Image, Input, Row, Skeleton, Tooltip, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import MessageList from './MessageList';
import TicketInformation from './TicketInformation';
import CustomerIcon from '../assets/CustomerIcon.svg';
import useCreateChatDataApi from '../hooks/useCreateChatDataApi';
import useSocketChat from '../hooks/useSocketChat';
import { useTicketChatListingApi } from '../hooks/useTicketChatListingApi';

const { Text } = Typography;

interface ChatProps {
    chatId: number;
    onTabChange: () => void;
}

const Chat = ({ chatId, onTabChange }: ChatProps) => {
    const [reload, setReload] = useState<boolean>(false);
    const { data, isLoading } = useSocketChat(chatId, reload);

    const {
        data: messages,
        isLoading: isLoadingChat,
        requesterId,
        getTicketChatList,
    } = useTicketChatListingApi(chatId);
    const { handleTicketChatCreation } = useCreateChatDataApi();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [chatMobile, setChatMobile] = useState(false);

    const { xs } = useScreenSize();

    const handleButtonClick = useCallback(
        () => async () => {
            if (!newMessage.trim()) return;
            const payload = {
                body: newMessage,
                id: chatId,
            };
            await handleTicketChatCreation(payload);
            await getTicketChatList();

            setNewMessage('');
        },
        [chatId, getTicketChatList, handleTicketChatCreation, newMessage]
    );

    // const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    //     if (event.key === 'Enter' && !event.shiftKey) {
    //         event.preventDefault();
    //         handleSendMessage();
    //     }
    // };

    return (
        <Row className="h-full sm:h-[42rem]">
            {isLoading && isLoadingChat ? (
                <Col span={24}>
                    <Skeleton active avatar />
                </Col>
            ) : (
                <>
                    {(!xs || (xs && !chatMobile)) && (
                        <TicketInformation
                            chatId={chatId}
                            onTabChange={onTabChange}
                            data={data}
                            setReload={setReload}
                        />
                    )}
                    {(!xs || (xs && chatMobile)) && (
                        <Col
                            xs={24}
                            md={16}
                            className="flex flex-col w-full h-full py-2 rounded-md sm:rounded-2xl sm:m-2 sm:p-4 sm:bg-chatCardBg"
                        >
                            <Flex vertical className="sm:mt-4">
                                <Flex justify="start" align="center">
                                    <Flex className="w-2 h-2 mx-2 bg-green-500 rounded-full">
                                        <Text className="text-transparent">.</Text>
                                    </Flex>
                                    <Text className="sm:text-xl sm:font-medium">
                                        Peko Customer Executive
                                    </Text>
                                </Flex>
                            </Flex>
                            <Divider />
                            <MessageList
                                messages={messages}
                                messagesEndRef={messagesEndRef}
                                requesterId={requesterId}
                            />
                            {data?.status !== 'Closed' && data?.status !== 'Resolved' ? (
                                <Flex
                                    className="pt-3 mt-auto ms-2"
                                    justify="space-between"
                                    align="center"
                                    gap={5}
                                >
                                    <Input
                                        placeholder="Type a message"
                                        className="flex-grow bg-white sm:p-3 hover:bg-white me-2"
                                        size={xs ? 'middle' : 'large'}
                                        // onKeyDown={handleKeyDown}
                                        variant={xs ? 'outlined' : 'borderless'}
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                    />

                                    <Button
                                        // disabled
                                        type="primary"
                                        shape="circle"
                                        size={xs ? 'middle' : 'large'}
                                        onClick={handleButtonClick}
                                        icon={
                                            xs ? (
                                                <ArrowUpOutlined />
                                            ) : (
                                                <CaretRightOutlined
                                                    style={{ fontSize: 24 }}
                                                    className="pl-1"
                                                />
                                            )
                                        }
                                        danger
                                    />
                                </Flex>
                            ) : (
                                <Flex vertical className="py-5" justify="center" align="center">
                                    <Divider />
                                    <Text className="text-gray-500 mt-7">
                                        You can no longer send conversations to this chat
                                    </Text>
                                </Flex>
                            )}
                        </Col>
                    )}
                    {!chatMobile && (
                        <Flex className="fixed bottom-4 right-4 sm:hidden">
                            <Tooltip title="How, Can I help you?" placement="top">
                                <Button
                                    type="primary"
                                    shape="circle"
                                    size="large"
                                    className="text-white bg-red-500 hover:bg-red-700 focus:bg-red-700 active:bg-red-800"
                                    onClick={() => setChatMobile(true)}
                                >
                                    <Image src={CustomerIcon} width={17} preview={false} />
                                </Button>
                            </Tooltip>
                        </Flex>
                    )}
                </>
            )}
        </Row>
    );
};
export default React.memo(Chat);
