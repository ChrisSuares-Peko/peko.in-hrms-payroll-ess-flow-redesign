import React from 'react';

import { Avatar } from 'antd';

type AvatarProps = {
    logo: string | undefined;
    name: string | undefined;
};

export default function CustomAvatar({ logo, name = ' ' }: AvatarProps) {
    if (logo) return <Avatar src={<img src={logo} alt={name} />} />;
    return (
        <Avatar style={{ backgroundColor: '#FFE6E6', color: '#FF4F4F', fontWeight: 'bolder' }}>
            {name?.[0].toUpperCase()}
        </Avatar>
    );
}
