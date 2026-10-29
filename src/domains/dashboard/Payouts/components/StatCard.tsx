import React from 'react';

import { Avatar, Layout, Skeleton, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

const { Text } = Typography;
const { Content } = Layout;

interface StatCardProps {
    label: string;
    value: string;
    bgColor?: string;
    icon?: string;
    loading?: boolean;
    prefix?: string;
    iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, bgColor, icon, loading, prefix, iconColor }) => (
    <Content
        className="rounded-2xl p-4 flex flex-col justify-start"
        style={{ background: bgColor || '#F9F6F5' }}
    >
        {icon && (
            <Avatar
                size={36}
                shape="circle"
                style={{ background: '#ffffff', marginBottom: '8px' }}
                icon={<ReactSVG src={icon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }} beforeInjection={iconColor ? (svg) => { svg.querySelectorAll('path, circle, rect, polygon').forEach(el => el.setAttribute('fill', iconColor)); } : undefined} />}
            />
        )}
        <Text className="text-xs tracking-wide text-gray-400 mb-1 whitespace-nowrap">{label}</Text>
        {loading ? (
            <Skeleton.Input active size="small" style={{ width: 80, marginTop: 4 }} />
        ) : (
            <Text className="text-xl font-bold">{prefix}{value}</Text>
        )}
    </Content>
);

export default StatCard;
