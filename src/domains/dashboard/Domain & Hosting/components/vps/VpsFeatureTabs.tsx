import React, { useMemo } from 'react';

import { Tabs, Typography } from 'antd';

import AdditionalStorageTab from './tabs/AdditionalStorageTab';
import DeployTab from './tabs/DeployTab';
import ManageTab from './tabs/ManageTab';
import SecureTab from './tabs/SecureTab';
import SupportTab from './tabs/SupportTab';

const { Title } = Typography;

interface Props {
    osIcons: { label: string; src: string }[];
    acronisPricePerGb: number | null;
    acronisMinStorageGb?: number | null;
    acronisMaxStorageGb?: number | null;
}

const VpsFeatureTabs: React.FC<Props> = ({
    osIcons,
    acronisPricePerGb,
    acronisMinStorageGb,
    acronisMaxStorageGb,
}) => {
    const tabItems = useMemo(
        () => [
            { key: 'deploy', label: 'Deploy', children: <DeployTab osIcons={osIcons} /> },
            {
                key: 'additionalStorage',
                label: 'Backup Storage',
                children: (
                    <AdditionalStorageTab
                        pricePerGb={acronisPricePerGb}
                        minStorageGb={acronisMinStorageGb}
                        maxStorageGb={acronisMaxStorageGb}
                    />
                ),
            },
            { key: 'manage', label: 'Manage', children: <ManageTab /> },
            { key: 'secure', label: 'Secure', children: <SecureTab /> },
            { key: 'support', label: 'Get Support', children: <SupportTab /> },
        ],
        [osIcons, acronisPricePerGb, acronisMinStorageGb, acronisMaxStorageGb]
    );

    return (
        <div className="pt-6 px-2 pb-8">
            <div className="mb-3 mt-10">
                <Title
                    level={3}
                    style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#1e293b' }}
                >
                    Features
                </Title>
            </div>
            <Tabs items={tabItems} tabBarStyle={{ paddingLeft: 20, marginBottom: 0 }} />
        </div>
    );
};

export default VpsFeatureTabs;
