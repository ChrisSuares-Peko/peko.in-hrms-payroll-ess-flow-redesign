import React, { useEffect, useState } from 'react';

import { GlobalOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

interface FreezoneIntroCardProps {
    logo?: string;
    title: string;
    description?: string;
}

const FreezoneIntroCard: React.FC<FreezoneIntroCardProps> = ({ logo, title, description }) => {
    const [imgError, setImgError] = useState(false);

    // Reset the error state when the source changes (e.g. switching jurisdiction)
    // so a new icon URL gets a fresh attempt.
    useEffect(() => setImgError(false), [logo]);

    const showImg = Boolean(logo) && !imgError;

    return (
        <Flex gap={16} align="flex-start">
            <div className="rounded-xl border border-stone-200 p-2 shrink-0" style={{ lineHeight: 0 }}>
                <div
                    style={{
                        width: 58,
                        height: 58,
                        borderRadius: 6,
                        background: showImg ? '#fff' : '#FFF0F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    {showImg ? (
                        <img
                            src={logo}
                            onError={() => setImgError(true)}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            alt={`${title} logo`}
                        />
                    ) : (
                        <GlobalOutlined style={{ fontSize: 26, color: '#FF4F4F' }} />
                    )}
                </div>
            </div>
            <Flex vertical gap={6}>
                <Typography.Text className="text-xl font-semibold text-neutral-900">
                    {title}
                </Typography.Text>
                {description && (
                    <Typography.Text className="text-base text-neutral-500 leading-snug">
                        {description}
                    </Typography.Text>
                )}
            </Flex>
        </Flex>
    );
};

export default FreezoneIntroCard;
