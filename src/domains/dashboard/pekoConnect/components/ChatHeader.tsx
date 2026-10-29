import React from 'react';

import { Avatar, Typography, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import { useAppSelector } from '@src/hooks/store';

import audioCallIcon from '../assets/audioCall.svg';
import videoCallIcon from '../assets/videoCall.svg';

const { Text } = Typography;

const ChatHeader = ({ rName, handleCall, recieverId, sendId }: any) => {
    const { user } = useAppSelector(state => state.reducer.user);
    const username = user?.username !== recieverId ? recieverId : sendId;
    return (
        <Flex align="center" gap={8} className="px-4 py-3">
            <Flex gap={16} className="flex-grow" align="center">
                <Avatar
                    style={{ backgroundColor: '#FFE6E6', color: '#FF4F4F', fontWeight: 'bolder' }}
                >
                    {rName?.[0]?.toUpperCase()}
                </Avatar>
                <Flex vertical gap={1}>
                    <Text className="font-medium">{rName}</Text>
                    <Text className="text-sm text-gray-400">Peko ID: {username}</Text>
                </Flex>
            </Flex>
            <ReactSVG
                src={audioCallIcon}
                onClick={() => handleCall('audio')}
                data-testid="audio-call"
                className="cursor-pointer"
                beforeInjection={svg => svg.setAttribute('style', 'width: 23px; height: 23px;')}
            />
            <ReactSVG
                src={videoCallIcon}
                data-testid="video-call"
                onClick={() => handleCall('video')}
                className="cursor-pointer"
                beforeInjection={svg => svg.setAttribute('style', 'width: 23px; height: 23px;')}
            />
        </Flex>
    );
};

export default React.memo(ChatHeader);
