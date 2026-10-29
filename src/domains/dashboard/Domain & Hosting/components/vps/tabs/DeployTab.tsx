import React from 'react';

import { Flex, Typography } from 'antd';

import CpanelIcon from '../../../assets/svg/cpanel.svg';
import PleskIcon from '../../../assets/svg/plesk.svg';
import WhmcsIcon from '../../../assets/svg/whmcs.svg';
import { iconCircleClass, TabLayout } from '../../../utils/vpsTabUtils';

const { Title } = Typography;

const PANEL_ICONS = [
    { label: 'cPanel/WHM', src: CpanelIcon },
    { label: 'Plesk', src: PleskIcon },
    { label: 'WHMCS', src: WhmcsIcon },
];

interface Props {
    osIcons: { label: string; src: string }[];
}

const DeployTab: React.FC<Props> = ({ osIcons }) => (
    <TabLayout>
        <div className="mb-5">
            <Title level={5} style={{ marginBottom: 4 }}>Instant Provisioning</Title>
            <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                Set up and running instantly! Our servers are provisioned within a few minutes.
            </p>
        </div>
        <div className="mb-5">
            <Title level={5} style={{ marginBottom: 6 }}>Choose your Operating System</Title>
            <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                Get complete flexibility to choose the operating system that works for you. Here are
                operating systems available with our service.
            </p>
            <Flex gap={24} wrap="wrap">
                {osIcons.map(({ label, src }) => (
                    <Flex key={label} vertical align="center" gap={6}>
                        <div className={`bg-gray-50 ${iconCircleClass}`}>
                            <img src={src} alt={label} className="h-7 w-7 object-contain" />
                        </div>
                        <span className="text-gray-500" style={{ fontSize: 11 }}>{label}</span>
                    </Flex>
                ))}
            </Flex>
        </div>
        <div>
            <Title level={5} style={{ marginBottom: 6 }}>Choose your management panel</Title>
            <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
                Optionally, you can choose easy-to-use tools for easy Server Management.
            </p>
            <Flex gap={24} wrap="wrap">
                {PANEL_ICONS.map(({ label, src }) => (
                    <Flex key={label} vertical align="center" gap={6}>
                        <div className={`bg-gray-50 ${iconCircleClass}`}>
                            <img src={src} alt={label} className="h-7 w-7 object-contain" />
                        </div>
                        <span className="text-gray-500" style={{ fontSize: 11 }}>{label}</span>
                    </Flex>
                ))}
            </Flex>
        </div>
    </TabLayout>
);

export default DeployTab;
