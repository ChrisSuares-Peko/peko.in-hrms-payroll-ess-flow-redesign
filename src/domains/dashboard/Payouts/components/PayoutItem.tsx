import React from 'react';

import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

interface PayoutItemProps {
    name: string;
    category: string;
    date: string;
    amount: string;
    status: string;
}

const formatCategory = (category: string) =>
    category
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

const statusColors: Record<string, string> = {
    COMPLETED: '#43B75D',
    PENDING: '#FAAD14',
    FAILED: '#FF4D4F',
    PROCESSING: '#1677FF',
};

const tagStyle: Record<string, React.CSSProperties> = {
    COMPLETED: {
        color: '#43B75D',
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        border: '1px solid #43B75D',
    },
    PENDING: {
        color: '#FAAD14',
        backgroundColor: '#FFF7E6',
        borderRadius: 16,
        border: '1px solid #FAAD14',
    },
    FAILED: {
        color: '#FF4D4F',
        backgroundColor: '#FFF1F0',
        borderRadius: 16,
        border: '1px solid #FF4D4F',
    },
    PROCESSING: {
        color: '#1677FF',
        backgroundColor: '#E6F4FF',
        borderRadius: 16,
        border: '1px solid #1677FF',
    },
};

const PayoutItem: React.FC<PayoutItemProps> = ({ name, category, date, amount, status }) => {
    const normalizedStatus = status?.toUpperCase();
    const formattedDate = date ? dayjs(date).format('MMM D, YYYY') : '—';
    const formattedCategory = category ? formatCategory(category) : '—';

    return (
        <Card
            bordered={false}
            className="rounded-xl border border-solid border-[#f0f0f0]"
        >
            <Row justify="space-between" align="middle">
                <Col>
                    <Space direction="vertical" size={4}>
                        <Text className="font-semibold">{name}</Text>
                        <Text type="secondary" className="text-xs">
                            {formattedCategory} • {formattedDate}
                        </Text>
                    </Space>
                </Col>
                <Col>
                    <Space direction="vertical" align="center" size={4}>
                        <Text strong>{amount}</Text>
                        <Tag style={tagStyle[normalizedStatus] ?? { borderRadius: 16 }}>
                            <span style={{ color: statusColors[normalizedStatus] ?? undefined, fontSize: 11 }}>
                                {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1).toLowerCase()}
                            </span>
                        </Tag>
                    </Space>
                </Col>
            </Row>
        </Card>
    );
};

export default PayoutItem;
