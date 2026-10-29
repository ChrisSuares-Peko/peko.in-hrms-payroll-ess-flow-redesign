import { useState } from 'react';

import { Space, Typography } from 'antd';

import GeneralTab from './GeneralTab';
// import IntegrationsTab from './IntegrationsTab';
// import PlansBillingTab from './PlansBillingTab';
import RolesPermissionsTab from './RolesPermissionsTab';
import PageTabs from '../common/PageTabs';

const { Text, Title } = Typography;

const SETTINGS_TABS = [
    { key: 'general', label: 'General' },
    { key: 'roles-permissions', label: 'Roles & Permissions' },
    // { key: 'integrations', label: 'Integrations' },
    // { key: 'plans-billing', label: 'Plans & Billing' },
];

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <Space direction="vertical" size={24} className="w-full">
            <Space direction="vertical" size={4}>
                <Title level={3} className="!mb-0 !text-textHeadings">
                    Settings
                </Title>
                <Text className="text-sm text-textBody">
                    Workspace, roles, and preferences.
                </Text>
            </Space>
            <PageTabs tabs={SETTINGS_TABS} activeKey={activeTab} onChange={setActiveTab} />
            {activeTab === 'general' && <GeneralTab />}
            {activeTab === 'roles-permissions' && <RolesPermissionsTab />}
            {/* {activeTab === 'integrations' && <IntegrationsTab />} */}
            {/* {activeTab === 'plans-billing' && <PlansBillingTab />} */}
        </Space>
    );
};

export default SettingsPage;
