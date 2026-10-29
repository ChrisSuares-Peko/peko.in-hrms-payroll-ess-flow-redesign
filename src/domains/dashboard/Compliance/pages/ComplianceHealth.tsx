import { useState, useEffect } from 'react';

import { Flex, Select, Tabs, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import { getComplianceListApi } from '../api';
import {
    ACTIVE_COLOR,
    AllComplianceIcon,
    AllComplianceTab,
    INACTIVE_COLOR,
    OneTimeIcon,
    OneTimeTab,
    RecurringIcon,
    RecurringTab,
} from '../components/ComplianceHealth';
import {
    type ComplianceCategory,
    type ComplianceHealthItem,
    complianceHealthItems,
    complianceSections,
} from '../utils/data';

const { Text } = Typography;

const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
];

const getTabItems = (activeTab: string) => [
    {
        key: 'all',
        label: (
            <Flex align="center" gap={4} style={{ color: activeTab === 'all' ? ACTIVE_COLOR : INACTIVE_COLOR }}>
                <AllComplianceIcon active={activeTab === 'all'} />
                <Text className="!text-[inherit] !text-[13px] sm:!text-[16px] !font-medium">All compliance</Text>
            </Flex>
        ),
    },
    {
        key: 'one-time',
        label: (
            <Flex align="center" gap={4} style={{ color: activeTab === 'one-time' ? ACTIVE_COLOR : INACTIVE_COLOR }}>
                <OneTimeIcon active={activeTab === 'one-time'} />
                <Text className="!text-[inherit] !text-[13px] sm:!text-[16px] !font-medium">One - time</Text>
            </Flex>
        ),
    },
    {
        key: 'recurring',
        label: (
            <Flex align="center" gap={4} style={{ color: activeTab === 'recurring' ? ACTIVE_COLOR : INACTIVE_COLOR }}>
                <RecurringIcon active={activeTab === 'recurring'} />
                <Text className="!text-[inherit] !text-[13px] sm:!text-[16px] !font-medium">Recurring</Text>
            </Flex>
        ),
    },
];

export default function ComplianceHealth() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = (searchParams.get('tab') as ComplianceCategory) ?? 'all';
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [mergedItems, setMergedItems] = useState<ComplianceHealthItem[]>(complianceHealthItems);
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);

    useEffect(() => {
        getComplianceListApi({ userId, userType, page: 1, pageSize: 100, searchText: '', from: '', to: '' }).then(result => {
            if (!result) return;
            const titleToId: Record<string, string> = {};
            result.rows.forEach(row => { titleToId[row.title] = String(row.id); });
            setMergedItems(complianceHealthItems.map(item =>
                titleToId[item.title] ? { ...item, applicationId: titleToId[item.title] } : item
            ));
        });
    }, [userId, userType]);

    const handleTabChange = (key: string) => {
        setSearchParams({ tab: key });
        setStatusFilter('all');
    };

    const filtered = mergedItems.filter((item) => {
        if (activeTab !== 'one-time' && item.sectionOnly) return false;
        const matchesTab = activeTab === 'all' || item.category === activeTab;
        const matchesStatus = statusFilter === 'all' || item.statusType === statusFilter;
        return matchesTab && matchesStatus;
    });

    const sectionsWithItems = complianceSections
        .map((sec) => ({ ...sec, items: filtered.filter((i) => i.section === sec.key) }))
        .filter((sec) => sec.items.length > 0);

    return (
        <Flex vertical gap={24} className="min-h-screen bg-white sm:!gap-10">
            <Flex vertical gap={6}>
                <Text className="!text-[20px] sm:!text-[28px] !font-semibold !leading-[38px] !text-[#101828] block">
                    Compliance Health
                </Text>
                <Text className="!text-[14px] sm:!text-[20px] !font-normal !leading-[24px] sm:!leading-[32px] !text-[#6a7282] block">
                    Complete overview of all your compliance requirements
                </Text>
            </Flex>

            <Flex vertical gap={16}>
                <Flex vertical gap={8} className="sm:flex-row sm:items-center sm:justify-between">
                    <style>{`.compliance-health-tabs .ant-tabs-ink-bar { background: ${ACTIVE_COLOR} !important; }`}</style>
                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        items={getTabItems(activeTab)}
                        className="compliance-health-tabs !mb-0 w-full sm:w-auto"
                        tabBarGutter={32}
                    />
                    <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={statusOptions}
                        className="!h-10 !w-full sm:!w-[160px]"
                        popupMatchSelectWidth={false}
                    />
                </Flex>

                {activeTab === 'all' && <AllComplianceTab items={filtered} />}
                {activeTab === 'one-time' && <OneTimeTab sections={sectionsWithItems} />}
                {activeTab === 'recurring' && <RecurringTab sections={sectionsWithItems} />}
            </Flex>
        </Flex>
    );
}
