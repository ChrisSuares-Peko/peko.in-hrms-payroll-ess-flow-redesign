import { useEffect, useState, type FC } from 'react';

import { Flex, Tabs, Typography } from 'antd';
import { TabsProps } from 'antd/lib';

// import GeneralSettings from '../components/settings/GeneralSettings';
import SubscriptionSettings from '../components/settings/SubscriptionSettings';

interface SettingsPageProps {}

const SettingsPage: FC<SettingsPageProps> = () => {
    const [activeTabKey, setActiveTabKey] = useState<string>('1');
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Subscription Settings',
            children: <SubscriptionSettings key="Subscription Settings" />,
        },
        // {
        //     key: '2',
        //     label: 'General Settings',
        //     children: <GeneralSettings key="General Settings" />,
        //     disabled: true,
        // },
    ];
    const handleTabChange = (key: string) => {
        setActiveTabKey(key);
    };
    useEffect(() => {}, [activeTabKey]);
    return (
        <Flex vertical gap={20}>
            <Typography.Text className="text-lg font-medium sm:text-xl">
                eSign Settings
            </Typography.Text>
            <Tabs
                activeKey={activeTabKey}
                defaultActiveKey="1"
                items={items}
                onChange={handleTabChange}
            />
        </Flex>
    );
};

export default SettingsPage;
