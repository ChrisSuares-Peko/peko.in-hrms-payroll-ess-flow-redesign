import React, { useEffect, useState } from 'react';

import { Card, Flex, Tabs, Typography } from 'antd';
import { TabsProps } from 'antd/lib';

import ActualDaysTab from './ActualDaysTab';
import CompanyWorkingDays from './CompanyWorkingDays';

const WorkDetailsWithTabs: React.FC<{data:any; calculateSalaryBasedOn?: string}> = ({data, calculateSalaryBasedOn}) => {
    const [activeTabKey, setActiveTabKey] = useState<string>('1');
    const handleTabChange = (key: string) => {
        setActiveTabKey(key);
    };
    useEffect(() => {
        if (calculateSalaryBasedOn === 'COMPANYWORKINGDAYS') setActiveTabKey('2');
        else setActiveTabKey('1');
    }, [calculateSalaryBasedOn]);
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Actual Days In A Month',
            children: <ActualDaysTab key="Actual days" data={data}/>,
        },
        {
            key: '2',
            label: 'Company Working Days',
            children: <CompanyWorkingDays key="Company Working Days" data={data}/>,
        },
    ];

    return (
        <Card bordered={false} style={{ backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <Flex vertical>
                <Typography.Text className="text-xl font-semibold text-center">
                    How This Works
                </Typography.Text>
                <Tabs
                    activeKey={activeTabKey}
                    defaultActiveKey="1"
                    items={items}
                    onChange={handleTabChange}
                />
            </Flex>
        </Card>
    );
};

export default WorkDetailsWithTabs;
