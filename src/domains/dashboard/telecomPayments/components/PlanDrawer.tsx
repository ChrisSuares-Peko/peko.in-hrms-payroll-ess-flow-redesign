/* eslint-disable no-nested-ternary */
import React, { useCallback, useMemo, useState } from 'react';

import { LeftOutlined, RightOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { Drawer, Flex, Spin, Tabs, TabsProps, Typography, Button } from 'antd';

import PlanCard from './PlanCard';
import { PlanDrawerProps } from '../types/index';
import { formatServiceProvider } from '../utils/data';

const { Text } = Typography;

const PlanDrawer = ({
    isOpen,
    handleClose,
    planCategories,
    plansData,
    serviceProvider,
    isLoading,
}: PlanDrawerProps) => {
    const dynamicItems: TabsProps['items'] = useMemo(() => {
        const categoryMapping: Record<string, string> = {
            'Data Add On': 'Data Packs',
            Jiophone: 'JioPhone',
            Smartphone: 'Popular Plans',
            'Topup Plan': 'Top-Up Plan',
        };

        return [...planCategories].reverse().map((category, index) => {
            const planData = plansData.filter(plan => plan.PlanName === category);
            return {
                key: String(index),
                label: categoryMapping[category] || category,
                children: (
                    <div style={{ maxHeight: '800px', overflowY: 'auto', padding: '10px' }}>
                        {planData.map((item, i) => (
                            <PlanCard
                                key={`${index}-${i}`}
                                amount={item.Amount}
                                validity={item.Validity}
                                description={item.Description}
                                handleClose={handleClose}
                            />
                        ))}
                    </div>
                ),
            };
        });
    }, [handleClose, planCategories, plansData]);

    const [activeTab, setActiveTab] = useState<string>(
        dynamicItems.length ? dynamicItems[0].key : '0'
    );

    const handleTabChange = useCallback((key: string) => {
        setActiveTab(key);
    }, []);

    const goToTab = useCallback(
        (direction: 'prev' | 'next') => {
            if (dynamicItems.length === 0) return;

            const currentIndex = dynamicItems.findIndex(item => item.key === activeTab);
            if (currentIndex === -1) return;

            const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

            // Ensure the index remains within bounds
            if (newIndex >= 0 && newIndex < dynamicItems.length) {
                setActiveTab(dynamicItems[newIndex].key);
            }
        },
        [activeTab, dynamicItems]
    );

    return (
        <Drawer
            open={isOpen}
            onClose={handleClose}
            width={500}
            title={
                <Flex justify="space-between">
                    <Text className="text-xl font-xl">
                        {formatServiceProvider(serviceProvider)} Plans
                    </Text>
                    <CloseOutlined className="text-xl" onClick={handleClose} />
                </Flex>
            }
            closeIcon={null}
            styles={{
                body: { paddingInline: 30, paddingBlock: 16 },
                header: { paddingInline: 30 },
            }}
            zIndex={20}
            maskClosable
        >
            {isLoading ? (
                <Flex className="h-full" align="center" justify="center">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </Flex>
            ) : dynamicItems.length ? (
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
                            className="!rounded-lg"
                            icon={<LeftOutlined />}
                            onClick={() => goToTab('prev')}
                            disabled={activeTab === dynamicItems[0].key}
                        />
                        <Button
                            type="text"
                            className="!rounded-lg"
                            icon={<RightOutlined />}
                            onClick={() => goToTab('next')}
                            disabled={activeTab === dynamicItems[dynamicItems.length - 1].key}
                        />
                    </Flex>

                    <Tabs activeKey={activeTab} onChange={handleTabChange} items={dynamicItems} />
                </div>
            ) : (
                <Flex align="center" justify="center" className="h-full">
                    <Text>No plans available at the moment</Text>
                </Flex>
            )}
        </Drawer>
    );
};
export default PlanDrawer;
