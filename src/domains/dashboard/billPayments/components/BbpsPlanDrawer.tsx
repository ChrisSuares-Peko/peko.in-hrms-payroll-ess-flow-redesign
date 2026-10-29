import React, { useCallback, useMemo, useState } from 'react';

import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Flex, Tabs, TabsProps, Typography } from 'antd';

import { BbpsPlan } from '../hooks/useFetchBillApi';

interface BbpsPlanDrawerProps {
    open: boolean;
    plans: BbpsPlan[];
    onClose: () => void;
    onSelectPlan: (plan: BbpsPlan) => void;
}

const planTypeLabel: Record<string, string> = {
    RECOMMENDED: 'Recommended',
    CURATED: 'Curated',
};

const { Text } = Typography;

const BbpsPlanDrawer: React.FC<BbpsPlanDrawerProps> = ({ open, plans, onClose, onSelectPlan }) => {
    const tabItems: TabsProps['items'] = useMemo(() => {
        const grouped = plans.reduce<Record<string, BbpsPlan[]>>((acc, plan) => {
            const type = plan.planType || 'OTHER';
            if (!acc[type]) acc[type] = [];
            acc[type].push(plan);
            return acc;
        }, {});

        return Object.entries(grouped).map(([type, typePlans], index) => ({
            key: String(index),
            label: planTypeLabel[type] || type,
            children: (
                <div style={{ maxHeight: '800px', overflowY: 'auto', padding: '10px' }}>
                    <Flex vertical gap={12}>
                        {typePlans.map(plan => (
                            <div
                                key={plan.planId}
                                className="px-4 py-5 rounded-md mb-2"
                                style={{ background: '#F9F9F9' }}
                            >
                                <Flex justify="space-between" align="center">
                                    <Text className="font-semibold text-base">{plan.planName}</Text>
                                    <Button
                                        danger
                                        className="h-full text-xs font-medium sm:text-base sm:px-5"
                                        onClick={() => onSelectPlan(plan)}
                                    >
                                        ₹ {plan.amount}
                                    </Button>
                                </Flex>
                            </div>
                        ))}
                    </Flex>
                </div>
            ),
        }));
    }, [plans, onSelectPlan]);

    const [activeTab, setActiveTab] = useState<string>(
        tabItems.length ? tabItems[0].key : '0'
    );

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key);
    }, []);

    const goToTab = useCallback(
        (direction: 'prev' | 'next') => {
            if (!tabItems.length) return;
            const currentIndex = tabItems.findIndex(item => item.key === activeTab);
            if (currentIndex === -1) return;
            const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (newIndex >= 0 && newIndex < tabItems.length) {
                setActiveTab(tabItems[newIndex].key);
            }
        },
        [activeTab, tabItems]
    );

    let planDrawerBody: React.ReactNode = null;
    if (plans.length === 0) {
        planDrawerBody = <Empty description="No plans available" />;
    } else if (tabItems.length > 0) {
        planDrawerBody = (
            <div
                style={{
                    position: 'sticky',
                    top: 0,
                    background: '#fff',
                    zIndex: 10,
                    paddingBottom: 8,
                }}
            >
                <Flex justify="space-between" align="center">
                    <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={() => goToTab('prev')}
                        disabled={activeTab === tabItems[0].key}
                    />
                    <Button
                        type="text"
                        icon={<RightOutlined />}
                        onClick={() => goToTab('next')}
                        disabled={activeTab === tabItems[tabItems.length - 1].key}
                    />
                </Flex>
                <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
            </div>
        );
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={500}
            title={
                <Flex justify="space-between">
                    <Text className="text-xl font-xl">Select a Plan</Text>
                    <CloseOutlined className="text-xl" onClick={onClose} />
                </Flex>
            }
            closeIcon={null}
            styles={{
                body: { paddingInline: 30, paddingBlock: 16 },
                header: { paddingInline: 30 },
            }}
        >
            {planDrawerBody}
        </Drawer>
    );
};

export default BbpsPlanDrawer;