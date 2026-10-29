/* eslint-disable no-unsafe-optional-chaining */

import React, { useMemo } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Flex, Typography, Image, Empty } from 'antd';
import { FiPhoneIncoming, FiPhoneOutgoing } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';

import { useAppSelector } from '@src/hooks/store';

import documentDefault from '../assets/documentDefault.svg';
import { getDisplayDate, groupMessagesByDate } from '../utils';

type ChatBodyProps = {
    messages: any[];
};

const { Text } = Typography;

const ChatBody = ({ messages }: ChatBodyProps) => {
    const { user: currentUser } = useAppSelector(state => state.reducer.user);
    const currentUserEmail = currentUser?.email;

    // Group messages by date
    const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

    // const isEmoji = (text: string) => {
    //     const emojiRegex =
    //         /^[\u231A-\uFE0F\u1F000-\u1F9FF\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u1F700-\u1F77F\u1F780-\u1F7FF\u1F800-\u1F8FF\u1F900-\u1FAFF]+$/;
    //     return emojiRegex.test(text);
    // };

    return (
        <>
            {Object.keys(groupedMessages).length === 0 && (
                <Flex justify="center" align="center" className="h-full">
                    <Empty description="No messages yet" />
                </Flex>
            )}
            <div className="flex flex-col-reverse bg-gray-100 max-h-[calc(10vh-50px)]">
                {Object.keys(groupedMessages).map(dateKey => (
                    <div key={dateKey} className="flex flex-col gap-4 px-4">
                        {/* Display the date once per group */}
                        <div className="py-2 text-center text-gray-500">
                            {getDisplayDate(dateKey)}
                        </div>
                        {groupedMessages[dateKey].map((message: any) => {
                            const { id, text, sender, createdAt, fileUrl, type } = message;
                            const isSender = sender === currentUserEmail;
                            const renderMessageBubble = () => {
                                if (type === 'text' && text) {
                                    return (
                                        <Flex
                                            className={twMerge(
                                                'text-sm font-normal rounded-xl select-text p-3',
                                                isSender
                                                    ? 'rounded-br-none bg-[#fce5e5]'
                                                    : 'rounded-tl-none bg-white'
                                            )}
                                        >
                                            <Text>{text}</Text>
                                        </Flex>
                                    );
                                }
                                if (type === 'image' || (type === 'file' && fileUrl)) {
                                    return (
                                        <Flex className="relative">
                                            <Image
                                                src={fileUrl}
                                                alt="file"
                                                loading="lazy"
                                                onError={e => {
                                                    (e.target as HTMLImageElement).src =
                                                        documentDefault;
                                                }}
                                                width={200}
                                                className="object-cover w-full h-full rounded-xl"
                                                preview={false}
                                            />
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                download
                                                className="absolute p-1 border-none shadow-lg bg-gray-50 top-2 right-2"
                                            >
                                                <DownloadOutlined />
                                            </a>
                                        </Flex>
                                    );
                                }

                                if (type === 'Call') {
                                    return (
                                        <Flex
                                            className="px-4 py-1 border rounded-xl"
                                            align="center"
                                            gap={8}
                                        >
                                            {isSender ? <FiPhoneOutgoing /> : <FiPhoneIncoming />}
                                            <span>
                                                {isSender ? 'Outgoing Call' : 'Incoming Call'}
                                            </span>
                                        </Flex>
                                    );
                                }

                                return null;
                            };

                            return (
                                <Flex key={id} className="flex flex-col gap-1">
                                    <Flex
                                        className={twMerge(
                                            'flex flex-col max-w-[80%] gap-1',
                                            isSender ? 'self-end' : 'self-start'
                                        )}
                                    >
                                        {/* Message bubble */}
                                        {renderMessageBubble()}
                                        {/* Timestamp */}
                                        <Flex className="flex items-center self-end gap-1 px-1">
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(
                                                    createdAt?.seconds * 1000
                                                ).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </div>
                ))}
            </div>
        </>
    );
};

export default React.memo(ChatBody);
