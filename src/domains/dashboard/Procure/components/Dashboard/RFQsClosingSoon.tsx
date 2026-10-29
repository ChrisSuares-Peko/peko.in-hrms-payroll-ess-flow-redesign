import React from 'react';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { DashboardActiveRfq } from '../../types';

const { Text, Title } = Typography;

interface Props {
    rfqs: DashboardActiveRfq[];
    isLoading: boolean;
}

const RFQsClosingSoon: React.FC<Props> = ({ rfqs, isLoading }) => {
    const navigate = useNavigate();

    const renderContent = () => {
        if (isLoading) return <Skeleton active paragraph={{ rows: 3 }} />;
        if (rfqs.length === 0) return (
            <Flex align="center" justify="center" style={{ height: 120 }}>
                <Text className="text-sm text-gray-400">No active RFQs closing soon.</Text>
            </Flex>
        );
        return (
            <Flex vertical gap={22}>
                {rfqs.map(rfq => (
                    <div key={rfq.id} className="flex items-start justify-between gap-3">
                        <div className="flex flex-col min-w-0 flex-1" style={{ gap: 2 }}>
                            <Text className="block truncate" style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a', lineHeight: '20px' }}>{rfq.title}</Text>
                            <Text className="block truncate" style={{ fontSize: 12, color: '#999', lineHeight: '16px' }}>{rfq.refNumber} · {rfq.vendorInvites?.submitted ?? 0}/{rfq.vendorInvites?.total ?? 0} submitted · {rfq.vendorInvites?.pending ?? 0} pending</Text>
                        </div>
                        <div className="flex items-center justify-between shrink-0" style={{ width: 109 }}>
                            <Flex align="center" gap={4} style={{ color: '#ff4f4f' }}>
                                <ClockCircleOutlined style={{ fontSize: 12 }} />
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{rfq.daysRemaining}d</span>
                            </Flex>
                            <Button
                                danger
                                size="small"
                                style={{ borderRadius: 6 }}
                                onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}/${rfq.id}`)}
                            >
                                View
                            </Button>
                        </div>
                    </div>
                ))}
            </Flex>
        );
    };

    return (
       <div className="rounded-[20px] p-4 bg-white border border-gray-100 h-full">
             <div className="mb-4">
                <Title level={5} className="!mb-0">RFQs Closing Soon</Title>
            </div>
            
            {renderContent()}
        </div>
    );
};

export default RFQsClosingSoon;
