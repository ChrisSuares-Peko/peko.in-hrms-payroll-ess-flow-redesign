import React, { RefObject } from 'react';

import { Flex, Avatar, Typography, Empty, Image } from 'antd';

import LogoXs from '@assets/LogoXs.png';
import { formattedTime } from '@utils/dateFormat';

import { Chat } from '../types/type';
import groupMessagesByDate from '../utils';

const { Text } = Typography;

type Props = {
    messages: Chat[];
    messagesEndRef: RefObject<HTMLDivElement>;
    requesterId: Number;
};

const MessageList = ({ messages, messagesEndRef, requesterId }: Props) => {
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
                            <Text className="px-3 py-1 text-sm rounded-full bg">{group.date}</Text>
                        </Flex>
                        {group.messages.map((message, i) =>
                            message.user_id !== requesterId ? (
                                <Flex className="mt-3 ms-2" align="start" vertical key={i}>
                                    <Flex align="flex-start">
                                        <Avatar size="small" className="bg-gray-200">
                                            <Image preview={false} loading="lazy" src={LogoXs} />
                                        </Avatar>
                                        <Text className="text-xs text-gray-300 ms-2 sm:text-sm">
                                            {formattedTime(new Date(message.created_at))}
                                        </Text>
                                    </Flex>
                                    <Flex className="max-w-[60%] px-4 py-2  ms-10 rounded-bl-3xl rounded-br-3xl rounded-tr-3xl bg-gray-200 sm:bg-white">
                                        <Text>{message.body_text}</Text>
                                    </Flex>
                                </Flex>
                            ) : (
                                <Flex className="mt-3 me-2" align="end" vertical key={i}>
                                    <Flex align="flex-start">
                                        <Text className="text-xs text-gray-300 ms-2 sm:text-sm">
                                            {formattedTime(new Date(message.created_at))}
                                        </Text>
                                    </Flex>
                                    <Flex className="max-w-[60%] mt-1 px-4 py-2  ms-10 rounded-bl-3xl rounded-tl-3xl rounded-tr-3xl bg-chatBg">
                                        <Text className="text-white">{message.body_text}</Text>
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

export default React.memo(MessageList);
