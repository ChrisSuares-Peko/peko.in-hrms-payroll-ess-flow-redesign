import React, { memo } from 'react';

import { Typography, Avatar } from 'antd';

import { useAppSelector } from '@src/hooks/store';

type Props = {
    localVideoRef: React.RefObject<HTMLVideoElement>;
    videoMuted: boolean;
};
const { Text } = Typography;

const LocalAvatarRenderer = ({ localVideoRef, videoMuted }: Props) => {
    const { user } = useAppSelector(state => state.reducer.user);
    return (
        !videoMuted && (
            <div className="absolute z-50 flex items-center justify-center w-32 h-32 bg-gray-800 rounded-md bottom-6 right-6 md:bottom-8 md:right-4 md:w-72 md:h-52">
                <Avatar
                    size="small"
                    draggable={false}
                    shape="circle"
                    className="bg-[#ffeeee] w-16 h-16 md:w-28 md:h-28"
                >
                    <Text className="text-3xl font-bold md:text-6xl text-brandColor">
                        {user?.companyName?.[0]?.toUpperCase() || '-'}
                    </Text>
                </Avatar>
            </div>
        )
    );
};
export default memo(LocalAvatarRenderer);
