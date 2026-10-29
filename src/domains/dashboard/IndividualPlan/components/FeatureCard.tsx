import React from 'react';

import { Image } from 'antd';

interface FeatureCardProps {
    icon: string;
    title?: string;
    description?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '16px',
            backgroundColor: '#FFF9F9',
            margin: '10px auto 0 auto',
            overflow: 'hidden',
        }}
    >
        <Image
            height="190px"
            width="190px"
            src={icon}
            alt="Feature Icon"
            preview={false}
            style={{ borderRadius: '16px', maxWidth: '100%', height: 'auto' }}
        />
    </div>
);

export default FeatureCard;
