import React, { RefObject } from 'react';

import { Flex, Avatar, Typography, Empty, Image } from 'antd';

import LogoXs from '@assets/LogoXs.png';
import { formattedTime } from '@utils/dateFormat';

import { Chat } from '../types/type';
import groupMessagesByDate from '../utils';

type Props = {
    messages: Chat[];
    messagesEndRef: RefObject<HTMLDivElement>;
};

const MessageList = ({ messages, messagesEndRef }: Props) => {
    const groupedMessages = groupMessagesByDate(messages);
    return (
        <Flex
            className="h-[70vh] flex-grow sm:h-auto overflow-y-scroll scroll-smooth"
            vertical
            ref={messagesEndRef}
        >
            {groupedMessages.length ? (
                groupedMessages.map((group, groupIndex) => (
                    <Flex vertical key={groupIndex}>
                        <Flex className="my-4 text-center" align="center" justify="center">
                            <Typography.Text className="px-3 py-1 text-sm rounded-full bg">
                                {group.date}
                            </Typography.Text>
                        </Flex>
                        {group.messages.map((message, i) =>
                            message.admin ? (
                                <Flex className="mt-3 me-2" align="end" vertical key={i}>
                                    <Flex align="flex-start">
                                        <Typography.Text className="text-xs text-gray-300 ms-2 sm:text-sm">
                                            {formattedTime(new Date(message.date))}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex className="max-w-[60%] mt-1 px-4 py-2  ms-10 rounded-bl-3xl rounded-tl-3xl rounded-tr-3xl bg-chatBg">
                                        <Typography.Text className="text-white">
                                            {message.message}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            ) : (
                                <Flex className="mt-3 ms-2" align="start" vertical key={i}>
                                    <Flex align="flex-start">
                                        <Avatar size="small" className="bg-gray-200">
                                            <Image preview={false} src={LogoXs} />
                                        </Avatar>
                                        <Typography.Text className="text-xs text-gray-300 ms-2 sm:text-sm">
                                            {formattedTime(new Date(message.date))}
                                        </Typography.Text>
                                    </Flex>
                                    <Flex className="max-w-[60%] px-4 py-2  ms-10 rounded-bl-3xl rounded-br-3xl rounded-tr-3xl bg-gray-200 sm:bg-white">
                                        <Typography.Text>{message.message}</Typography.Text>
                                    </Flex>
                                </Flex>
                            )
                        )}
                    </Flex>
                ))
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No messages"
                    className="flex flex-col justify-center min-h-[60vh]"
                />
            )}
        </Flex>
    );
};

export default MessageList;
