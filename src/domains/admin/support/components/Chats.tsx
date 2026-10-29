import { useEffect, useRef, useState } from 'react';

import { ArrowUpOutlined, CaretRightOutlined } from '@ant-design/icons';
import {
    Button,
    Col,
    Divider,
    Flex,
    Grid,
    Image,
    Input,
    Row,
    Skeleton,
    Tooltip,
    Typography,
} from 'antd';

import MessageList from './MessageList';
import TicketInformation from './TicketInformation';
import CustomerIcon from '../assets/CustomerIcon.svg';
import useSocketChat from '../hooks/useSocketChat';

interface ChatProps {
    chatId: number | null;
    onTabChange: () => void;
}

const Chat = ({ chatId, onTabChange }: ChatProps) => {
    const { data, isLoading, messages, sendMessage } = useSocketChat(chatId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState('');
    const [chatMobile, setChatMobile] = useState(false);

    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        const messageToSend = {
            message: newMessage,
            date: new Date().toISOString(),
            admin: true,
            isAdmin: true,
            name: 'Admin',
            supportId: chatId,
        };
        sendMessage(messageToSend);
        setNewMessage('');
    };
    useEffect(() => {
        const scrollTimeout = setTimeout(() => {
            scrollToBottom();
        }, 300);
        return () => clearTimeout(scrollTimeout);
    }, [data, newMessage]);
    return (
        <Row className="h-full sm:h-[42rem]">
            {isLoading ? (
                <Col span={24}>
                    <Skeleton active avatar />
                </Col>
            ) : (
                <>
                    {(!screens.xs || (screens.xs && !chatMobile)) && (
                        <TicketInformation chatId={chatId} onTabChange={onTabChange} data={data} />
                    )}
                    {(!screens.xs || (screens.xs && chatMobile)) && (
                        <Col
                            xs={24}
                            md={16}
                            className="flex flex-col w-full h-full py-2 rounded-md sm:rounded-2xl sm:m-2 sm:p-4 sm:bg-chatCardBg"
                        >
                            <Flex vertical className="sm:mt-4">
                                <Flex justify="start" align="center">
                                    <Flex className="w-2 h-2 mx-2 bg-green-500 rounded-full">
                                        <Typography.Text className="text-transparent">
                                            .
                                        </Typography.Text>
                                    </Flex>
                                    <Typography.Text className="sm:text-xl sm:font-medium">
                                        Peko Customer Executive
                                    </Typography.Text>
                                </Flex>
                            </Flex>
                            <Divider />
                            <MessageList messages={messages} messagesEndRef={messagesEndRef} />
                            <Flex
                                className="pt-3 mt-auto ms-2"
                                justify="space-between"
                                align="center"
                                gap={5}
                                hidden={data?.status === 'REJECTED'}
                            >
                                <Input
                                    placeholder="Type a message"
                                    className="flex-grow bg-white sm:p-3 hover:bg-white me-2"
                                    size={screens.xs ? 'middle' : 'large'}
                                    onKeyDown={handleKeyDown}
                                    variant={screens.xs ? 'outlined' : 'borderless'}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                />
                                <Button
                                    type="primary"
                                    shape="circle"
                                    size={screens.xs ? 'middle' : 'large'}
                                    onClick={handleSendMessage}
                                    icon={
                                        screens.xs ? (
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
export default Chat;
