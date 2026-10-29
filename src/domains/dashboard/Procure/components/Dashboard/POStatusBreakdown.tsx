import React from 'react';

import { Flex, Skeleton, Typography } from 'antd';

import { DashboardPOStatus } from '../../types';

const { Text, Title } = Typography;

const STATUS_COLORS: Record<string, string> = {
    'In Progress': '#4338ca',
    'Sent':        '#ec4899',
    'Acknowledged':'#b45309',
    'Draft':       '#f59e0b',
    'Completed':   '#22c55e',
    'Cancelled':   '#ff4d4f',
};
const FALLBACK_COLOR = '#6b7280';

interface Props {
    poStatus?: { total: number; statuses: DashboardPOStatus[] };
    isLoading?: boolean;
}

const POStatusBreakdown: React.FC<Props> = ({ poStatus, isLoading }) => {
    const statuses = poStatus?.statuses ?? [];

    const renderContent = () => {
        if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;
        if (statuses.length === 0) return (
            <Flex align="center" justify="center" style={{ height: 120 }}>
                <Text className="text-sm text-gray-400">No PO data available</Text>
            </Flex>
        );
        return (
            <Flex vertical gap={16} className="mt-5">
                {statuses.map(s => (
                    <Flex key={s.status} align="center" gap={12}>
                        <Text className="text-xs text-gray-700 w-28 shrink-0">{s.status}</Text>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                            <div
                                className="h-2.5 rounded-full"
                                style={{ width: `${s.percentage}%`, background: STATUS_COLORS[s.status] ?? FALLBACK_COLOR }}
                            />
                        </div>
                        <Text className="text-xs text-gray-500 w-8 text-right shrink-0">{s.percentage}%</Text>
                    </Flex>
                ))}
            </Flex>
        );
    };

    return (
         <div className="rounded-[20px] p-4 bg-white border border-gray-100 h-full">
            <Title level={5} className="!mb-4">PO Status Breakdown</Title>
            {renderContent()}
        </div>
    );
};

export default POStatusBreakdown;