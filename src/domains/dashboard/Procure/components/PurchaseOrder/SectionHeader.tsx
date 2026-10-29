import React from 'react';

import {  Image, Typography } from 'antd';

const { Text } = Typography;

type Props = {
    icon: string;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
    iconSize?: number;
};

const SectionHeader: React.FC<Props> = ({ icon, title, subtitle, action, iconSize = 24 }) => (
    <div style={{ marginBottom: 16, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 37, height: 37, flexShrink: 0, backgroundColor: '#fff1f0', borderRadius: 10 }}>
                <Image src={icon} alt={title} width={iconSize} height={iconSize} preview={false} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</Text>
            </div>
            {action && <div style={{ flexShrink: 0, marginLeft: 'auto' }} className="hidden sm:block">{action}</div>}
        </div>
        {action && <div style={{ marginTop: 8, paddingLeft: 47 }} className="block sm:hidden">{action}</div>}
    </div>
);

export default SectionHeader;
