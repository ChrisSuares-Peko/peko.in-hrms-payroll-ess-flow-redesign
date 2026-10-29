import React, { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Tabs, Typography } from 'antd';

import ApplyForLeaveModal from '../components/sections/ApplyForLeaveModal';
import LeaveBalanceTab from '../components/sections/LeaveBalanceTab';
import MyRequestsTab from '../components/sections/MyRequestsTab';
import PublicHolidaysTab from '../components/sections/PublicHolidaysTab';
import { useLeaves } from '../hooks/useLeaves';

const { Title, Text } = Typography;

type LeaveTab = 'balance' | 'requests' | 'holidays';

const Leaves: React.FC = () => {
    const [activeTab, setActiveTab] = useState<LeaveTab>('balance');
    const [applyOpen, setApplyOpen] = useState(false);
    const {
        leaves,
        leavesTotal,
        leavesLimit,
        availableLeaves,
        fetchLeaves,
        fetchBalance,
        applyLeave,
        cancelLeave,
    } = useLeaves();

    const tabItems = [
        {
            key: 'balance' as LeaveTab,
            label: 'Leave Balance',
            children: (
                <LeaveBalanceTab availableLeaves={availableLeaves} fetchBalance={fetchBalance} />
            ),
        },
        {
            key: 'requests' as LeaveTab,
            label: 'My Requests',
            children: (
                <MyRequestsTab
                    leaves={leaves}
                    total={leavesTotal}
                    limit={leavesLimit}
                    fetchLeaves={fetchLeaves}
                    cancelLeave={cancelLeave}
                />
            ),
        },
        { key: 'holidays' as LeaveTab, label: 'Public Holidays', children: <PublicHolidaysTab /> },
    ];

    return (
        <div className="w-full">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                <div>
                    <Title level={4} className="text-valueText mb-0.5">
                        Leave Management
                    </Title>
                    <Text className="text-titleText text-sm">
                        Manage your leave requests and balances
                    </Text>
                </div>
                {activeTab !== 'holidays' && (
                    <Button
                        type="primary"
                        danger
                        icon={<PlusOutlined />}
                        className="font-medium"
                        onClick={() => setApplyOpen(true)}
                    >
                        Apply for Leave
                    </Button>
                )}
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as LeaveTab)}
                items={tabItems}
            />

            <ApplyForLeaveModal
                open={applyOpen}
                onClose={() => setApplyOpen(false)}
                onSubmit={applyLeave}
            />
        </div>
    );
};

export default Leaves;
